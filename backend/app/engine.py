import math
from datetime import date, timedelta
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from .models import (
    Meal, Ingredient, Recipe, RecipeIngredient,
    Supplier, SupplierIngredient, InventoryBatch,
    InventoryTransaction, DemandForecast, ProcurementRecommendation,
    PurchaseOrder, PurchaseOrderItem
)

def run_procurement_engine(db: Session, forecast_week: int = 146, centre_id: int = 55) -> List[Dict[str, Any]]:
    """
    Core Material Requirements Planning (MRP) Engine.
    Connects Forecast -> Recipe BOM -> Prep Yield -> Inventory Batches -> Lead Times -> Purchase Recommendations.
    """
    today = date.today()
    # Need date is usually the beginning of the forecast week (e.g., Monday in 5 days)
    need_date = today + timedelta(days=5)

    # 1. Fetch Forecasted Meals for the week
    forecasts = db.query(DemandForecast).filter(
        DemandForecast.forecast_week == forecast_week,
        DemandForecast.centre_id == centre_id
    ).all()

    if not forecasts:
        # Fallback to any forecasts available
        forecasts = db.query(DemandForecast).filter(DemandForecast.forecast_week == forecast_week).all()

    forecast_map = {f.meal_id: f.predicted_orders for f in forecasts}

    # 2. Recipe Bill of Materials (BOM) Explosion & Aggregation
    # Shared ingredients across all recipes are aggregated into gross_requirements
    gross_requirements: Dict[str, float] = {}
    ingredient_meal_breakdown: Dict[str, List[Dict[str, Any]]] = {}

    recipes = db.query(Recipe).filter(Recipe.active_status == True).all()
    for recipe in recipes:
        orders = forecast_map.get(recipe.meal_id, 0.0)
        if orders <= 0:
            continue

        for item in recipe.ingredients:
            ing_id = item.ingredient_id
            required_qty = orders * item.quantity_per_serving

            gross_requirements[ing_id] = gross_requirements.get(ing_id, 0.0) + required_qty

            if ing_id not in ingredient_meal_breakdown:
                ingredient_meal_breakdown[ing_id] = []
            ingredient_meal_breakdown[ing_id].append({
                "meal_id": recipe.meal_id,
                "meal_name": recipe.meal.meal_name if recipe.meal else recipe.recipe_name,
                "orders": orders,
                "qty_per_serving": item.quantity_per_serving,
                "subtotal": round(required_qty, 2),
                "unit": item.unit
            })

    # Clear previous recommendations for this week to avoid duplicates
    db.query(ProcurementRecommendation).filter(
        ProcurementRecommendation.forecast_week == forecast_week
    ).delete()

    recommendations = []

    # 3. Process every unique ingredient required
    for ing_id, gross_qty in gross_requirements.items():
        ingredient = db.query(Ingredient).filter(Ingredient.ingredient_id == ing_id).first()
        if not ingredient:
            continue

        # Feature 6: Prep Yield & Trim loss factor
        # If yield is 85%, gross required is gross_qty / 0.85
        yield_factor = ingredient.prep_yield_pct if (ingredient.prep_yield_pct and ingredient.prep_yield_pct > 0) else 1.0
        yield_adjusted_qty = round(gross_qty / yield_factor, 2)

        # Available non-expired stock from batches
        # Batches expiring before the need_date cannot satisfy demand!
        active_batches = db.query(InventoryBatch).filter(
            InventoryBatch.ingredient_id == ing_id,
            InventoryBatch.remaining_qty > 0,
            InventoryBatch.expiry_date >= need_date
        ).all()
        usable_batch_stock = sum(b.remaining_qty for b in active_batches)

        # Pending Purchase Orders (Incoming stock)
        pending_items = db.query(PurchaseOrderItem).join(PurchaseOrder).filter(
            PurchaseOrderItem.ingredient_id == ing_id,
            PurchaseOrder.status.in_(["APPROVED", "ORDERED"]),
            PurchaseOrder.expected_delivery_date <= need_date
        ).all()
        incoming_stock = sum(item.quantity - item.received_qty for item in pending_items)

        safety_stock = ingredient.safety_stock or 0.0
        available_total = usable_batch_stock + incoming_stock

        # Net Requirement calculation
        raw_net_requirement = (yield_adjusted_qty + safety_stock) - available_total
        net_requirement = max(0.0, round(raw_net_requirement, 2))

        # Supplier selection (preferred or cheapest)
        pref_supplier_id = ingredient.preferred_supplier_id
        supp_link = None
        if pref_supplier_id:
            supp_link = db.query(SupplierIngredient).filter(
                SupplierIngredient.ingredient_id == ing_id,
                SupplierIngredient.supplier_id == pref_supplier_id
            ).first()

        if not supp_link:
            supp_link = db.query(SupplierIngredient).filter(
                SupplierIngredient.ingredient_id == ing_id
            ).first()

        unit_cost = supp_link.unit_cost if supp_link else ingredient.unit_cost
        moq = supp_link.minimum_order_qty if supp_link else 10.0
        pack_size = supp_link.pack_size if supp_link else 1.0
        base_lead_time = supp_link.lead_time_days if supp_link else ingredient.supplier_lead_time_days
        supplier_id = supp_link.supplier_id if supp_link else pref_supplier_id

        # Feature 7: Dynamic Supplier Risk Scorecard
        # If supplier OTIF is below 90%, add 1 day safety buffer to lead time
        supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first() if supplier_id else None
        lead_time = base_lead_time
        supplier_warning = ""
        if supplier and supplier.on_time_delivery_pct and supplier.on_time_delivery_pct < 90.0:
            lead_time += 1
            supplier_warning = f" (Lead time +1 day added due to {supplier.on_time_delivery_pct}% on-time delivery rate)"

        # Pack size rounding & MOQ
        if net_requirement > 0:
            # Round up to nearest pack size
            packs_needed = math.ceil(net_requirement / pack_size)
            recommended_qty = max(moq, packs_needed * pack_size)
        else:
            recommended_qty = 0.0

        estimated_cost = round(recommended_qty * unit_cost, 2)

        # Suggested Order Date = Need Date - Lead Time
        suggested_order_date = need_date - timedelta(days=lead_time)
        expected_delivery_date = suggested_order_date + timedelta(days=lead_time)

        # Feature 3: Explainable AI Breakdown
        if recommended_qty > 0:
            reason = (
                f"Gross forecast demand: {round(gross_qty, 2)} {ingredient.base_unit} across {len(ingredient_meal_breakdown.get(ing_id, []))} recipes. "
                f"Adjusted for {int(yield_factor * 100)}% prep yield: {yield_adjusted_qty} {ingredient.base_unit}. "
                f"Safety buffer target: +{safety_stock} {ingredient.base_unit}. "
                f"Usable unexpired stock: -{round(usable_batch_stock, 2)} {ingredient.base_unit}. "
                f"Confirmed incoming POs: -{round(incoming_stock, 2)} {ingredient.base_unit}. "
                f"Net deficit: {net_requirement} {ingredient.base_unit}, rounded to {recommended_qty} {ingredient.base_unit} "
                f"(MOQ: {moq}, Pack Size: {pack_size} {ingredient.base_unit}). "
                f"Must order by {suggested_order_date.strftime('%b %d')} to arrive by {need_date.strftime('%b %d')}{supplier_warning}."
            )
        else:
            reason = (
                f"Current usable stock ({round(usable_batch_stock, 2)} {ingredient.base_unit}) and incoming orders ({round(incoming_stock, 2)} {ingredient.base_unit}) "
                f"are sufficient to meet demand ({yield_adjusted_qty} {ingredient.base_unit}) plus safety reserve ({safety_stock} {ingredient.base_unit}). No purchase needed."
            )

        rec = ProcurementRecommendation(
            ingredient_id=ing_id,
            forecast_week=forecast_week,
            gross_requirement=round(gross_qty, 2),
            yield_adjusted_requirement=yield_adjusted_qty,
            available_stock=round(usable_batch_stock, 2),
            incoming_stock=round(incoming_stock, 2),
            safety_stock=safety_stock,
            net_requirement=net_requirement,
            recommended_qty=recommended_qty,
            pack_size=pack_size,
            estimated_cost=estimated_cost,
            suggested_order_date=suggested_order_date,
            expected_delivery_date=expected_delivery_date,
            preferred_supplier_id=supplier_id,
            reason=reason,
            status="PENDING"
        )
        db.add(rec)
        recommendations.append({
            "ingredient_id": ing_id,
            "ingredient_name": ingredient.ingredient_name,
            "category": ingredient.category,
            "base_unit": ingredient.base_unit,
            "storage_type": ingredient.storage_type,
            "prep_yield_pct": ingredient.prep_yield_pct,
            "gross_requirement": round(gross_qty, 2),
            "yield_adjusted_requirement": yield_adjusted_qty,
            "available_stock": round(usable_batch_stock, 2),
            "incoming_stock": round(incoming_stock, 2),
            "safety_stock": safety_stock,
            "net_requirement": net_requirement,
            "recommended_qty": recommended_qty,
            "unit_cost": unit_cost,
            "estimated_cost": estimated_cost,
            "suggested_order_date": str(suggested_order_date),
            "expected_delivery_date": str(expected_delivery_date),
            "supplier_name": supplier.supplier_name if supplier else "Preferred Vendor",
            "reason": reason,
            "breakdown": ingredient_meal_breakdown.get(ing_id, [])
        })

    db.commit()
    return recommendations

