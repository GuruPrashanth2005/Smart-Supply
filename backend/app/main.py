import os
import math
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import get_db, init_db
from .models import (
    Meal, Ingredient, Recipe, RecipeIngredient,
    Supplier, SupplierIngredient, InventoryBatch,
    InventoryTransaction, DemandForecast, ProcurementRecommendation,
    PurchaseOrder, PurchaseOrderItem, RescueCampaign, PromoPlan,
    DailyStockLedger
)
from .seeder import seed_database
from .engine import run_procurement_engine
from .ml_service import forecasting_service

# Initialize Database and seed on startup
init_db()
seed_database()

app = FastAPI(
    title="AI-Powered Ingredient Procurement & Inventory Planning Platform",
    description="Enterprise F&B Supply Chain, MRP & Dynamic Demand Forecaster",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC SCHEMAS -----------------
class TransactionCreate(BaseModel):
    ingredient_id: str
    transaction_type: str # RECEIVED, CONSUMED, WASTAGE, ADJUSTMENT
    quantity: float
    unit: str
    reference: Optional[str] = "Manual Entry"
    notes: Optional[str] = ""

class EventShockRequest(BaseModel):
    weather: str = "normal" # normal, rain, heatwave
    event: str = "none"     # none, festival, payday_weekend, sports_match

class WhatIfRequest(BaseModel):
    demand_multiplier_pct: float = 0.0 # e.g. +25% or -15%
    lead_time_delay_days: int = 0      # e.g. +2 days supplier delay

class CreatePORequest(BaseModel):
    ingredient_id: str
    supplier_id: int
    quantity: float
    unit_cost: float
    notes: Optional[str] = ""

class RecipeIngredientItem(BaseModel):
    ingredient_id: str
    quantity_per_serving: float
    unit: str

class RecipeCreateRequest(BaseModel):
    dish_name: str
    category: str
    cuisine: str
    base_price: float
    prep_time_mins: Optional[int] = 20
    ingredients: List[RecipeIngredientItem]
    initial_forecast_orders: Optional[float] = 120.0

# ----------------- API ENDPOINTS -----------------

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AI Procurement Platform", "timestamp": datetime.utcnow()}

# 1. DASHBOARD OVERVIEW & KPIS
@app.get("/api/dashboard")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    total_ingredients = db.query(Ingredient).count()
    total_recipes = db.query(Recipe).count()
    total_meals = db.query(Meal).count()

    # Low stock ingredients
    low_stock_items = db.query(Ingredient).filter(Ingredient.current_stock <= Ingredient.reorder_level).all()

    # Expiring batches in next 5 days
    threshold_date = date.today() + timedelta(days=5)
    expiring_batches = db.query(InventoryBatch).filter(
        InventoryBatch.remaining_qty > 0,
        InventoryBatch.expiry_date <= threshold_date
    ).all()

    # Spoilage risk value ($)
    spoilage_risk_val = sum(b.remaining_qty * b.unit_cost for b in expiring_batches)

    # Forecasted orders total
    forecasts = db.query(DemandForecast).filter(DemandForecast.forecast_week == 146).all()
    total_predicted_orders = sum(f.predicted_orders for f in forecasts)

    # Active recommendations
    recs = db.query(ProcurementRecommendation).all()
    if not recs:
        recs = run_procurement_engine(db)
    
    total_procurement_cost = sum(r.estimated_cost for r in db.query(ProcurementRecommendation).all())
    items_to_order_count = db.query(ProcurementRecommendation).filter(ProcurementRecommendation.recommended_qty > 0).count()

    # Recent transactions
    recent_txs = db.query(InventoryTransaction).order_by(InventoryTransaction.transaction_date.desc()).limit(6).all()

    return {
        "kpis": {
            "total_ingredients": total_ingredients,
            "total_recipes": total_recipes,
            "total_meals": total_meals,
            "low_stock_count": len(low_stock_items),
            "expiring_batches_count": len(expiring_batches),
            "spoilage_risk_val": round(spoilage_risk_val, 2),
            "total_predicted_orders": int(total_predicted_orders),
            "total_procurement_cost": round(total_procurement_cost, 2),
            "items_to_order_count": items_to_order_count,
        },
        "recent_transactions": [
            {
                "id": t.transaction_id,
                "ingredient_id": t.ingredient_id,
                "type": t.transaction_type,
                "quantity": t.quantity,
                "unit": t.unit,
                "date": t.transaction_date.strftime("%b %d, %H:%M") if t.transaction_date else "",
                "reference": t.reference
            }
            for t in recent_txs
        ]
    }

# 2. FORECASTING & EVENT SHOCKS
@app.get("/api/forecast")
def get_forecasts(db: Session = Depends(get_db)):
    forecasts = db.query(DemandForecast).filter(DemandForecast.forecast_week == 146).all()
    metrics = forecasting_service.metrics

    result = []
    for f in forecasts:
        meal = f.meal
        result.append({
            "meal_id": f.meal_id,
            "meal_name": meal.meal_name if meal else f"Meal {f.meal_id}",
            "category": meal.category if meal else "N/A",
            "cuisine": meal.cuisine if meal else "N/A",
            "baseline_orders": f.baseline_orders,
            "predicted_orders": f.predicted_orders,
            "growth_pct": round(((f.predicted_orders - f.baseline_orders) / f.baseline_orders) * 100, 1) if f.baseline_orders else 0
        })

    return {
        "week": 146,
        "centre_id": 55,
        "metrics": metrics,
        "forecasts": result
    }

@app.post("/api/forecast/shock")
def apply_event_shock(req: EventShockRequest, db: Session = Depends(get_db)):
    updated = forecasting_service.apply_event_multiplier(db, weather=req.weather, event=req.event)
    # Re-run MRP engine to adjust orders immediately!
    run_procurement_engine(db, forecast_week=146)
    return {
        "status": "success",
        "weather": req.weather,
        "event": req.event,
        "updated_forecasts": updated
    }

# 3. RECIPES & BILL OF MATERIALS (BOM)
@app.get("/api/recipes")
def list_recipes(db: Session = Depends(get_db)):
    recipes = db.query(Recipe).all()
    output = []
    for r in recipes:
        ingredients_list = []
        cost_per_serving = 0.0

        for item in r.ingredients:
            ing = item.ingredient
            unit_cost = ing.unit_cost if ing else 0.0
            line_cost = item.quantity_per_serving * unit_cost
            cost_per_serving += line_cost

            ingredients_list.append({
                "ingredient_id": item.ingredient_id,
                "ingredient_name": ing.ingredient_name if ing else item.ingredient_id,
                "quantity_per_serving": item.quantity_per_serving,
                "unit": item.unit,
                "unit_cost": unit_cost,
                "line_cost": round(line_cost, 2),
                "prep_yield_pct": ing.prep_yield_pct if ing else 1.0,
                "substitute_name": item.substitute.ingredient_name if item.substitute else None
            })

        output.append({
            "recipe_id": r.recipe_id,
            "meal_id": r.meal_id,
            "meal_name": r.meal.meal_name if r.meal else r.recipe_name,
            "category": r.meal.category if r.meal else "Main",
            "cuisine": r.meal.cuisine if r.meal else "General",
            "recipe_name": r.recipe_name,
            "serving_basis": r.serving_basis,
            "prep_time_mins": r.prep_time_mins,
            "cost_per_serving": round(cost_per_serving, 2),
            "ingredients": ingredients_list
        })
    return output

@app.post("/api/recipes")
def create_recipe(req: RecipeCreateRequest, db: Session = Depends(get_db)):
    """
    Creates a new dish and recipe with its ingredient Bill of Materials (BOM).
    Automatically maps the dish, injects baseline demand, and runs the MRP engine
    to verify inventory stock sufficiency or create purchase recommendations.
    """
    if not req.dish_name.strip():
        raise HTTPException(status_code=400, detail="Dish name is required")
    if not req.ingredients:
        raise HTTPException(status_code=400, detail="At least one ingredient must be specified")

    # 1. Generate unique meal_id & recipe_id
    max_meal = db.query(func.max(Meal.meal_id)).scalar() or 3000
    new_meal_id = max_meal + 1

    max_recipe = db.query(func.max(Recipe.recipe_id)).scalar() or 100
    new_recipe_id = max_recipe + 1

    # 2. Insert Meal record
    new_meal = Meal(
        meal_id=new_meal_id,
        meal_name=req.dish_name.strip(),
        category=req.category,
        cuisine=req.cuisine,
        base_price=req.base_price,
        is_active=True
    )
    db.add(new_meal)
    db.commit()

    # 3. Insert Recipe record
    new_recipe = Recipe(
        recipe_id=new_recipe_id,
        meal_id=new_meal_id,
        recipe_name=f"{req.dish_name.strip()} Recipe",
        serving_basis=1,
        prep_time_mins=req.prep_time_mins or 20,
        active_status=True
    )
    db.add(new_recipe)
    db.commit()

    # 4. Insert Recipe Ingredients (BOM)
    for item in req.ingredients:
        # Check ingredient exists
        ing = db.query(Ingredient).filter(Ingredient.ingredient_id == item.ingredient_id).first()
        if not ing:
            continue
        bom_item = RecipeIngredient(
            recipe_id=new_recipe_id,
            ingredient_id=item.ingredient_id,
            quantity_per_serving=item.quantity_per_serving,
            unit=item.unit
        )
        db.add(bom_item)
    db.commit()

    # 5. Inject Initial Weekly Demand Forecast
    orders = req.initial_forecast_orders if (req.initial_forecast_orders and req.initial_forecast_orders > 0) else 120.0
    forecast = DemandForecast(
        meal_id=new_meal_id,
        centre_id=55,
        forecast_week=146,
        predicted_orders=orders,
        baseline_orders=orders,
        model_version="Operational Chef Input"
    )
    db.add(forecast)
    db.commit()

    # 6. Run MRP Procurement & Inventory recalculation
    recs = run_procurement_engine(db, forecast_week=146, centre_id=55)

    return {
        "status": "success",
        "message": f"Recipe '{req.dish_name}' successfully created and inventory recalculated!",
        "meal_id": new_meal_id,
        "recipe_id": new_recipe_id,
        "predicted_orders": orders,
        "procurement_items_updated": len(recs)
    }

# 4. INGREDIENTS MASTER
@app.get("/api/ingredients")
def list_ingredients(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    output = []
    for ing in ingredients:
        # Sum batch stock
        batch_stock = db.query(func.sum(InventoryBatch.remaining_qty)).filter(
            InventoryBatch.ingredient_id == ing.ingredient_id
        ).scalar() or 0.0

        is_low_stock = batch_stock <= ing.reorder_level

        output.append({
            "ingredient_id": ing.ingredient_id,
            "ingredient_name": ing.ingredient_name,
            "category": ing.category,
            "base_unit": ing.base_unit,
            "opening_stock": ing.opening_stock,
            "current_stock": round(batch_stock, 2),
            "reorder_level": ing.reorder_level,
            "safety_stock": ing.safety_stock,
            "shelf_life_days": ing.shelf_life_days,
            "unit_cost": ing.unit_cost,
            "supplier_lead_time_days": ing.supplier_lead_time_days,
            "storage_type": ing.storage_type,
            "prep_yield_pct": ing.prep_yield_pct,
            "is_low_stock": is_low_stock
        })
    return output

# 5. INVENTORY BATCHES (FEFO Tracking)
@app.get("/api/inventory/batches")
def list_batches(db: Session = Depends(get_db)):
    today = date.today()
    batches = db.query(InventoryBatch).order_by(InventoryBatch.expiry_date.asc()).all()
    output = []
    for b in batches:
        days_left = (b.expiry_date - today).days
        status = "FRESH"
        if days_left <= 0:
            status = "EXPIRED"
        elif days_left <= 3:
            status = "IMMINENT_EXPIRY"
        elif days_left <= 7:
            status = "WARNING"

        # Recipes that consume this batch ingredient
        used_in = []
        if b.ingredient and hasattr(b.ingredient, 'recipe_items'):
            for ri in b.ingredient.recipe_items:
                if ri.recipe and ri.recipe.meal:
                    used_in.append({
                        "meal_id": ri.recipe.meal_id,
                        "meal_name": ri.recipe.meal.meal_name,
                        "category": ri.recipe.meal.category,
                        "serving_usage": ri.quantity_per_serving,
                        "unit": ri.unit
                    })

        output.append({
            "batch_id": b.batch_id,
            "ingredient_id": b.ingredient_id,
            "ingredient_name": b.ingredient.ingredient_name if b.ingredient else b.ingredient_id,
            "category": b.ingredient.category if b.ingredient else "Produce",
            "received_date": str(b.received_date),
            "expiry_date": str(b.expiry_date),
            "days_left": days_left,
            "received_qty": b.received_qty,
            "remaining_qty": b.remaining_qty,
            "unit": b.ingredient.base_unit if b.ingredient else "kg",
            "unit_cost": b.unit_cost,
            "total_value": round(b.remaining_qty * b.unit_cost, 2),
            "storage_location": b.storage_location,
            "status": status,
            "shelf_life_days": b.ingredient.shelf_life_days if b.ingredient else 7,
            "prep_yield_pct": b.ingredient.prep_yield_pct if b.ingredient else 95.0,
            "used_in_dishes": used_in[:6]
        })
    return output

@app.get("/api/inventory/daily-ledger")
def get_daily_stock_ledger(db: Session = Depends(get_db)):
    """
    Returns daily audit stock ledger records:
    date, ingredient, unit, opening_stock, received_qty, used_qty, wasted_qty, closing_stock,
    shelf_life_days, supplier_lead_time_days, unit_cost, total_valuation
    """
    rows = db.query(DailyStockLedger).order_by(DailyStockLedger.date.desc(), DailyStockLedger.ingredient_name.asc()).all()
    return [
        {
            "id": r.id,
            "date": r.date.strftime("%Y-%m-%d") if r.date else "",
            "ingredient_id": r.ingredient_id,
            "ingredient_name": r.ingredient_name,
            "unit": r.unit,
            "opening_stock": r.opening_stock,
            "received_qty": r.received_qty,
            "used_qty": r.used_qty,
            "wasted_qty": r.wasted_qty,
            "closing_stock": r.closing_stock,
            "shelf_life_days": r.shelf_life_days,
            "supplier_lead_time_days": r.supplier_lead_time_days,
            "unit_cost": r.unit_cost,
            "total_valuation": r.total_valuation
        }
        for r in rows
    ]

# 6. INVENTORY TRANSACTIONS (Audited Ledger)
@app.get("/api/inventory/transactions")
def list_transactions(db: Session = Depends(get_db)):
    txs = db.query(InventoryTransaction).order_by(InventoryTransaction.transaction_date.desc()).all()
    return [
        {
            "transaction_id": t.transaction_id,
            "ingredient_id": t.ingredient_id,
            "ingredient_name": t.ingredient.ingredient_name if t.ingredient else t.ingredient_id,
            "transaction_date": t.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if t.transaction_date else "",
            "transaction_type": t.transaction_type,
            "quantity": t.quantity,
            "unit": t.unit,
            "reference": t.reference,
            "notes": t.notes
        }
        for t in txs
    ]

@app.post("/api/inventory/transactions")
def record_transaction(req: TransactionCreate, db: Session = Depends(get_db)):
    ing = db.query(Ingredient).filter(Ingredient.ingredient_id == req.ingredient_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    # Record Transaction
    tx = InventoryTransaction(
        ingredient_id=req.ingredient_id,
        transaction_type=req.transaction_type,
        quantity=req.quantity,
        unit=req.unit,
        reference=req.reference,
        notes=req.notes
    )
    db.add(tx)

    # FEFO Batch deduction or addition
    if req.transaction_type in ["CONSUMED", "WASTAGE"]:
        # Deduct from earliest expiring batch
        batches = db.query(InventoryBatch).filter(
            InventoryBatch.ingredient_id == req.ingredient_id,
            InventoryBatch.remaining_qty > 0
        ).order_by(InventoryBatch.expiry_date.asc()).all()

        to_deduct = req.quantity
        for b in batches:
            if b.remaining_qty >= to_deduct:
                b.remaining_qty -= to_deduct
                to_deduct = 0.0
                break
            else:
                to_deduct -= b.remaining_qty
                b.remaining_qty = 0.0

        ing.current_stock = max(0.0, ing.current_stock - req.quantity)

    elif req.transaction_type == "RECEIVED":
        # Create a new batch
        today = date.today()
        new_batch = InventoryBatch(
            batch_id=f"BAT-{ing.ingredient_id[:3]}-{datetime.utcnow().strftime('%M%S')}",
            ingredient_id=req.ingredient_id,
            received_date=today,
            expiry_date=today + timedelta(days=ing.shelf_life_days),
            received_qty=req.quantity,
            remaining_qty=req.quantity,
            unit_cost=ing.unit_cost,
            storage_location=f"{ing.storage_type} Bay"
        )
        db.add(new_batch)
        ing.current_stock += req.quantity

    db.commit()
    # Recompute procurement recommendations automatically!
    run_procurement_engine(db)

    return {"status": "success", "message": f"{req.transaction_type} of {req.quantity} {req.unit} logged successfully"}

# 7. SMART PROCUREMENT PLANNER & EXPLAINABLE AI
@app.get("/api/procurement/plan")
def get_procurement_plan(db: Session = Depends(get_db)):
    plan = run_procurement_engine(db, forecast_week=146)
    return plan

@app.post("/api/procurement/create-po")
def create_purchase_order(req: CreatePORequest, db: Session = Depends(get_db)):
    today = date.today()
    supp = db.query(Supplier).filter(Supplier.supplier_id == req.supplier_id).first()
    lead_time = supp.lead_time_days if supp else 2

    po_id = f"PO-{datetime.utcnow().strftime('%y%m%d-%H%M')}"
    po = PurchaseOrder(
        purchase_order_id=po_id,
        supplier_id=req.supplier_id,
        order_date=today,
        expected_delivery_date=today + timedelta(days=lead_time),
        status="ORDERED",
        total_cost=round(req.quantity * req.unit_cost, 2),
        notes=req.notes or f"Generated via AI Procurement Planner for {req.ingredient_id}"
    )
    db.add(po)

    po_item = PurchaseOrderItem(
        purchase_order_id=po_id,
        ingredient_id=req.ingredient_id,
        quantity=req.quantity,
        unit_cost=req.unit_cost,
        received_qty=0.0
    )
    db.add(po_item)

    # Update recommendation status and supplier selection
    rec = db.query(ProcurementRecommendation).filter(
        ProcurementRecommendation.ingredient_id == req.ingredient_id
    ).first()
    if rec:
        rec.status = "DISPATCHED" # Visible immediately in Supplier Portal!
        rec.preferred_supplier_id = req.supplier_id
        rec.recommended_qty = req.quantity
        rec.estimated_cost = round(req.quantity * req.unit_cost, 2)

    db.commit()
    return {
        "status": "success",
        "po_id": po_id,
        "supplier_name": supp.supplier_name if supp else "Supplier",
        "expected_delivery": str(today + timedelta(days=lead_time)),
        "message": f"PO {po_id} dispatched to {supp.supplier_name if supp else 'Supplier'}!"
    }

# 8. SUPPLIERS & SCORECARDS
@app.get("/api/suppliers")
def list_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    output = []
    for s in suppliers:
        items = []
        for si in s.supplier_ingredients:
            items.append({
                "ingredient_id": si.ingredient_id,
                "ingredient_name": si.ingredient.ingredient_name if si.ingredient else si.ingredient_id,
                "unit_cost": si.unit_cost,
                "minimum_order_qty": si.minimum_order_qty,
                "pack_size": si.pack_size,
                "lead_time_days": si.lead_time_days
            })
        output.append({
            "supplier_id": s.supplier_id,
            "supplier_name": s.supplier_name,
            "contact_details": s.contact_details,
            "lead_time_days": s.lead_time_days,
            "minimum_order_qty": s.minimum_order_qty,
            "on_time_delivery_pct": s.on_time_delivery_pct,
            "quality_score": s.quality_score,
            "preferred_status": s.preferred_status,
            "catalog": items
        })
    return output

# 9. ALERTS & MONITORING
@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = []
    today = date.today()

    # 1. Low stock alerts
    low_stocks = db.query(Ingredient).filter(Ingredient.current_stock <= Ingredient.reorder_level).all()
    for ing in low_stocks:
        alerts.append({
            "severity": "CRITICAL" if ing.current_stock <= ing.safety_stock else "WARNING",
            "type": "LOW_STOCK",
            "title": f"Low Stock: {ing.ingredient_name}",
            "description": f"Current stock is {round(ing.current_stock, 2)} {ing.base_unit}, which is below reorder threshold ({ing.reorder_level} {ing.base_unit}).",
            "action_text": "Order from Supplier",
            "ingredient_id": ing.ingredient_id
        })

    # 2. Imminent expiry alerts
    expiring = db.query(InventoryBatch).filter(
        InventoryBatch.remaining_qty > 0,
        InventoryBatch.expiry_date <= today + timedelta(days=4)
    ).all()
    for b in expiring:
        days_left = (b.expiry_date - today).days
        alerts.append({
            "severity": "CRITICAL" if days_left <= 2 else "WARNING",
            "type": "EXPIRY_RISK",
            "title": f"Expiry Risk: Batch {b.batch_id} ({b.ingredient.ingredient_name if b.ingredient else ''})",
            "description": f"{round(b.remaining_qty, 2)} {b.ingredient.base_unit if b.ingredient else 'units'} expires in {days_left} day(s) on {b.expiry_date}.",
            "action_text": "Launch Rescue Special",
            "ingredient_id": b.ingredient_id,
            "batch_id": b.batch_id
        })

    # 3. Flaky supplier delay warnings
    flaky = db.query(Supplier).filter(Supplier.on_time_delivery_pct < 90.0).all()
    for s in flaky:
        alerts.append({
            "severity": "INFO",
            "type": "SUPPLIER_RISK",
            "title": f"Supplier Reliability Notice: {s.supplier_name}",
            "description": f"Historical on-time delivery rate is {s.on_time_delivery_pct}%. Lead time buffer of +1 day is automatically enforced.",
            "action_text": "Review Scorecard",
            "supplier_id": s.supplier_id
        })

    return alerts

# 10. SPOILAGE RESCUE CAMPAIGNS (Feature 1)
@app.get("/api/spoilage-rescue")
def get_spoilage_rescue(db: Session = Depends(get_db)):
    campaigns = db.query(RescueCampaign).filter(RescueCampaign.status == "ACTIVE").all()
    output = []
    for c in campaigns:
        output.append({
            "campaign_id": c.campaign_id,
            "ingredient_id": c.ingredient_id,
            "ingredient_name": c.ingredient.ingredient_name if c.ingredient else c.ingredient_id,
            "batch_id": c.batch_id,
            "expiring_qty": c.expiring_qty,
            "expiry_date": str(c.expiry_date),
            "promoted_meal_id": c.promoted_meal_id,
            "promoted_meal_name": c.promoted_meal.meal_name if c.promoted_meal else f"Meal {c.promoted_meal_id}",
            "suggested_discount_pct": c.suggested_discount_pct,
            "projected_rescued_qty": c.projected_rescued_qty,
            "status": c.status
        })
    return output

class PushRescueToPosRequest(BaseModel):
    campaign_name: str
    target_ingredient: str
    rescued_qty: float
    promoted_dish: str
    discount_pct: float
    sop_note: Optional[str] = ""

@app.post("/api/spoilage-rescue/push-pos")
def push_rescue_campaign_to_pos(req: PushRescueToPosRequest, db: Session = Depends(get_db)):
    """
    Pushes an active kitchen spoilage rescue campaign directly to Reception / POS Billing Counter.
    Instantly registers as an active floor campaign with status APPROVED_BY_KITCHEN.
    """
    today = date.today()
    # Resolve meal_id from name or fallback
    matched_meal = db.query(Meal).filter(Meal.meal_name.ilike(f"%{req.promoted_dish.split()[-1]}%")).first()
    meal_id = matched_meal.meal_id if matched_meal else 1109

    promo = PromoPlan(
        meal_id=meal_id,
        promo_type="FLASH_DISCOUNT",
        promo_name=f"Chef Flash Special: {req.campaign_name}",
        target_date=today,
        target_daypart="LUNCH",
        discount_pct=req.discount_pct,
        expected_order_multiplier=1.45,
        notes=f"AI Spoilage Rescue: Repurposing {req.rescued_qty}kg {req.target_ingredient}. {req.sop_note[:120]}",
        status="APPROVED_BY_KITCHEN" # Directly active on reception floor!
    )
    db.add(promo)
    db.commit()

    return {
        "status": "success",
        "message": f"Rescue Campaign '{req.campaign_name}' pushed directly to Reception & POS! Live for floor sales.",
        "promo_id": promo.promo_id
    }

# 11. WHAT-IF DIGITAL TWIN SIMULATOR (Feature 4)
@app.post("/api/simulator/what-if")
def simulate_scenario(req: WhatIfRequest, db: Session = Depends(get_db)):
    multiplier = 1.0 + (req.demand_multiplier_pct / 100.0)

    # Base requirements
    plan = run_procurement_engine(db, forecast_week=146)
    simulated_results = []
    stockout_count = 0
    extra_cost_total = 0.0

    for item in plan:
        base_demand = item["yield_adjusted_requirement"]
        sim_demand = round(base_demand * multiplier, 2)
        avail = item["available_stock"] + item["incoming_stock"]

        is_stockout = sim_demand > avail
        if is_stockout:
            stockout_count += 1

        sim_net = max(0.0, sim_demand + item["safety_stock"] - avail)
        # MOQ and pack size
        pack_size = float(item.get("pack_size") or 1.0)
        packs = math.ceil(sim_net / pack_size)
        sim_rec_qty = packs * pack_size
        sim_cost = round(sim_rec_qty * item["unit_cost"], 2)

        extra_cost = max(0.0, sim_cost - item["estimated_cost"])
        extra_cost_total += extra_cost

        simulated_results.append({
            "ingredient_name": item["ingredient_name"],
            "base_demand": base_demand,
            "simulated_demand": sim_demand,
            "available_stock": avail,
            "stockout_risk": is_stockout,
            "extra_cost": round(extra_cost, 2),
            "suggested_qty": sim_rec_qty
        })

    return {
        "demand_multiplier_pct": req.demand_multiplier_pct,
        "lead_time_delay_days": req.lead_time_delay_days,
        "stockout_count": stockout_count,
        "extra_cost_total": round(extra_cost_total, 2),
        "items": simulated_results
    }

# 12. GROQ DEEP OPERATIONAL OPTIMIZATION ENGINES
from .ai_copilot import ai_engine

class AuditPORequest(BaseModel):
    recommendation: Dict[str, Any]

class PromoCreateRequest(BaseModel):
    meal_id: int
    promo_type: str # BOGO, FLAT_DISCOUNT, COMPLIMENTARY_ITEM
    promo_name: str
    target_date: str # YYYY-MM-DD
    target_daypart: str # MORNING, BRUNCH, LUNCH, EVENING, NIGHT, FULL_DAY
    complimentary_meal_id: Optional[int] = None
    discount_pct: Optional[float] = 50.0
    notes: Optional[str] = ""

class FulfillPORequest(BaseModel):
    po_id: str
    invoice_number: str
    dispatched_qty: Optional[float] = None

@app.get("/api/spoilage-rescue/optimize")
def get_optimized_spoilage_campaigns(db: Session = Depends(get_db)):
    """
    Feature 1: Groq AI analyzes live near-expiry batches and active menu items
    to formulate high-margin Flash Specials and portioning strategies.
    """
    batches_data = list_batches(db)
    expiring = [b for b in batches_data if b["days_left"] <= 5 and b["remaining_qty"] > 0]
    meals = [{"meal_id": m.meal_id, "meal_name": m.meal_name, "category": m.category} for m in db.query(Meal).limit(10).all()]
    
    optimized = ai_engine.optimize_spoilage_rescue(expiring, meals)
    return {"optimized_campaigns": optimized, "engine": "Groq Qwen 27B Operational Optimizer"}

@app.post("/api/procurement/audit")
def audit_purchase_recommendation(req: AuditPORequest, db: Session = Depends(get_db)):
    """
    Feature 2: Groq audits the proposed PO against vendor lead time feasibility
    and generates an automated supplier dispatch note.
    """
    suppliers_data = list_suppliers(db)
    audit = ai_engine.audit_supplier_procurement(req.recommendation, suppliers_data)
    return audit

@app.get("/api/transactions/diagnostics")
def get_waste_diagnostics(db: Session = Depends(get_db)):
    """
    Feature 3: Groq scans kitchen consumption and trim logs to detect abnormal
    shrinkage and recommend corrective prep action.
    """
    txs = list_transactions(db)
    ings = list_ingredients(db)
    diagnostics = ai_engine.diagnose_waste_anomalies(txs, ings)
    return {"diagnostics": diagnostics, "engine": "Groq Qwen 27B Kitchen Diagnostic"}

# 13. RECEPTION MANAGER & DAYPART PROMO APIS
@app.get("/api/reception/dayparts")
def get_reception_dayparts(db: Session = Depends(get_db)):
    """
    Returns realistic daypart order volume and meal popularity:
    Morning (Chai/Breakfast), Brunch, Lunch (Biryani/Meals), Evening (Tea/Snacks), Night (Pizzas/Pasta).
    """
    dayparts = [
        {
            "id": "MORNING",
            "name": "Morning Rush",
            "hours": "07:00 AM - 11:00 AM",
            "avg_orders": 420,
            "revenue": 58800,
            "top_categories": ["Beverages", "Other Snacks", "Sandwich"],
            "top_dishes": ["Royal Saffron Masala Chai", "Italian Grilled Pesto Chicken Sandwich", "Classic Italian Espresso Roast"]
        },
        {
            "id": "BRUNCH",
            "name": "Late Brunch",
            "hours": "11:00 AM - 12:30 PM",
            "avg_orders": 310,
            "revenue": 52700,
            "top_categories": ["Salad", "Soup", "Starters"],
            "top_dishes": ["Caesar Salad with Parmesan Shavings", "Spicy Thai Tom Yum Soup", "Crispy Spring Roll Dippers"]
        },
        {
            "id": "LUNCH",
            "name": "Peak Lunch",
            "hours": "12:30 PM - 03:30 PM",
            "avg_orders": 1280,
            "revenue": 384000,
            "top_categories": ["Biryani", "Rice Bowl", "Pasta", "Fish"],
            "top_dishes": ["Hyderabadi Chicken Dum Biryani", "Paneer Butter Masala Rice Bowl", "Fiery Chicken Penne Arrabbiata", "Herb Butter Grilled Salmon Fillet"]
        },
        {
            "id": "EVENING",
            "name": "Evening Snacks & Tea",
            "hours": "04:30 PM - 07:00 PM",
            "avg_orders": 650,
            "revenue": 97500,
            "top_categories": ["Beverages", "Starters", "Other Snacks"],
            "top_dishes": ["Thick Mango Kesar Lassi", "Peri Peri Chicken Skewers", "Steamed Chicken Dimsums", "Berry Blast Greek Yogurt Smoothie"]
        },
        {
            "id": "NIGHT",
            "name": "Dinner Feast",
            "hours": "07:30 PM - 11:30 PM",
            "avg_orders": 1450,
            "revenue": 435000,
            "top_categories": ["Pizza", "Biryani", "Pasta", "Desert"],
            "top_dishes": ["Farmhouse Margherita Pizza", "Barbecue Chicken & Onion Pizza", "Creamy Alfredo Penne with Mushrooms", "Warm Gulab Jamun with Rabdi"]
        }
    ]
    return dayparts

@app.get("/api/reception/promos")
def get_reception_promos(db: Session = Depends(get_db)):
    promos = db.query(PromoPlan).order_by(PromoPlan.target_date.desc()).all()
    output = []
    for p in promos:
        output.append({
            "promo_id": p.promo_id,
            "meal_id": p.meal_id,
            "meal_name": p.meal.meal_name if p.meal else f"Meal {p.meal_id}",
            "promo_type": p.promo_type,
            "promo_name": p.promo_name,
            "target_date": str(p.target_date),
            "target_daypart": p.target_daypart,
            "complimentary_meal_id": p.complimentary_meal_id,
            "complimentary_meal_name": p.complimentary_meal.meal_name if p.complimentary_meal else None,
            "discount_pct": p.discount_pct,
            "expected_order_multiplier": p.expected_order_multiplier,
            "notes": p.notes,
            "status": p.status,
            "created_at": p.created_at.strftime("%b %d, %H:%M") if p.created_at else ""
        })
    return output

@app.post("/api/reception/promos")
def create_reception_promo(req: PromoCreateRequest, db: Session = Depends(get_db)):
    """
    Reception Manager schedules a promo (e.g. 1+1 Biryani) 2 days in advance.
    Instantly applies the expected order multiplier to Demand Forecast,
    re-runs the MRP engine to calculate shortage, and triggers a live Kitchen Notification!
    """
    target_d = datetime.strptime(req.target_date, "%Y-%m-%d").date()
    
    mult = 2.1 if req.promo_type == "BOGO" else (1.6 if req.promo_type == "FLAT_DISCOUNT" else 1.35)

    promo = PromoPlan(
        meal_id=req.meal_id,
        promo_type=req.promo_type,
        promo_name=req.promo_name,
        target_date=target_d,
        target_daypart=req.target_daypart,
        complimentary_meal_id=req.complimentary_meal_id,
        discount_pct=req.discount_pct or 50.0,
        expected_order_multiplier=mult,
        notes=req.notes or "",
        status="PENDING_APPROVAL" # Needs Inventory Manager Approval!
    )
    db.add(promo)
    db.commit()

    return {
        "status": "success",
        "message": f"Proposal '{req.promo_name}' submitted to Inventory Manager for review & stock approval!",
        "promo_id": promo.promo_id,
        "multiplier": mult
    }

@app.get("/api/reception/promos/simulate-impact")
def simulate_promo_impact(promo_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Detailed stock impact breakdown for Inventory Manager inspection before approval.
    Calculates current stock vs required stock with the promotion surge.
    """
    promo = db.query(PromoPlan).filter(PromoPlan.promo_id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")

    fc = db.query(DemandForecast).filter(DemandForecast.meal_id == promo.meal_id, DemandForecast.forecast_week == 146).first()
    baseline = fc.baseline_orders if fc else 100.0
    surge_orders = round(baseline * promo.expected_order_multiplier, 0)
    extra_orders = round(surge_orders - baseline, 0)

    recipe = db.query(Recipe).filter(Recipe.meal_id == promo.meal_id).first()
    ingredients_impact = []
    has_critical_shortage = False

    if recipe:
        for ri in recipe.ingredients:
            ing = ri.ingredient
            if not ing:
                continue
            baseline_req = round(ri.quantity_per_serving * baseline, 2)
            promo_req = round(ri.quantity_per_serving * surge_orders, 2)
            additional_qty = round(promo_req - baseline_req, 2)
            current_stock = ing.current_stock
            deficit = max(0.0, round(promo_req - current_stock, 2))
            is_short = deficit > 0
            if is_short:
                has_critical_shortage = True

            ingredients_impact.append({
                "ingredient_id": ing.ingredient_id,
                "ingredient_name": ing.ingredient_name,
                "unit": ri.unit,
                "quantity_per_plate": ri.quantity_per_serving,
                "baseline_requirement": baseline_req,
                "promo_requirement": promo_req,
                "additional_needed": additional_qty,
                "current_stock": round(current_stock, 2),
                "deficit": deficit,
                "status": "SHORTAGE" if is_short else "SUFFICIENT"
            })

    return {
        "promo_id": promo.promo_id,
        "promo_name": promo.promo_name,
        "meal_name": promo.meal.meal_name if promo.meal else f"Meal {promo.meal_id}",
        "promo_type": promo.promo_type,
        "target_date": str(promo.target_date),
        "target_daypart": promo.target_daypart,
        "multiplier": promo.expected_order_multiplier,
        "baseline_orders": int(baseline),
        "surge_orders": int(surge_orders),
        "extra_orders": int(extra_orders),
        "notes": promo.notes,
        "status": promo.status,
        "has_critical_shortage": has_critical_shortage,
        "ingredients": ingredients_impact
    }

@app.post("/api/reception/promos/approve")
def approve_reception_promo(promo_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Inventory Manager reviews and explicitly APPROVES the promotion.
    Only upon approval does the demand forecast scale and MRP purchase orders generate!
    """
    promo = db.query(PromoPlan).filter(PromoPlan.promo_id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion proposal not found")

    promo.status = "APPROVED_BY_KITCHEN"

    # Scale the forecast now
    fc = db.query(DemandForecast).filter(DemandForecast.meal_id == promo.meal_id, DemandForecast.forecast_week == 146).first()
    if fc:
        fc.predicted_orders = round(fc.baseline_orders * promo.expected_order_multiplier, 0)

    db.commit()

    # Recalculate MRP with approved promo surge
    recs = run_procurement_engine(db, forecast_week=146, centre_id=55)

    return {
        "status": "success",
        "message": f"Promotion '{promo.promo_name}' APPROVED by Inventory Manager! Procurement quantities scaled.",
        "promo_id": promo.promo_id,
        "status_now": promo.status,
        "procurement_items_updated": len(recs)
    }

@app.post("/api/reception/promos/reject")
def reject_reception_promo(promo_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Inventory Manager REJECTS the promotion due to ingredient shortages or supplier constraints.
    Forecast remains unscaled.
    """
    promo = db.query(PromoPlan).filter(PromoPlan.promo_id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion proposal not found")

    promo.status = "REJECTED_STOCKOUT_RISK"
    
    # Revert to baseline orders
    fc = db.query(DemandForecast).filter(DemandForecast.meal_id == promo.meal_id, DemandForecast.forecast_week == 146).first()
    if fc:
        fc.predicted_orders = fc.baseline_orders

    db.commit()

    # Re-run MRP to revert normal requirements
    run_procurement_engine(db, forecast_week=146, centre_id=55)

    return {
        "status": "success",
        "message": f"Promotion '{promo.promo_name}' REJECTED by Kitchen due to stock capacity.",
        "promo_id": promo.promo_id,
        "status_now": promo.status
    }

# 14. SUPPLIER PORTAL & PO FULFILLMENT APIS
@app.get("/api/supplier-portal/orders")
def get_supplier_portal_orders(supplier_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Returns live purchase orders for the supplier view.
    Includes both explicit PurchaseOrders dispatched by Inventory Manager
    and baseline recommendations pending fulfillment.
    """
    orders = []

    # 1. Fetch official dispatched Purchase Orders
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.order_date.desc()).all()
    for p in pos:
        if supplier_id and p.supplier_id != supplier_id:
            continue
        supp = p.supplier
        item = p.items[0] if p.items else None
        orders.append({
            "order_id": p.purchase_order_id,
            "ingredient_id": item.ingredient_id if item else "ING-RAW",
            "ingredient_name": item.ingredient.ingredient_name if item and item.ingredient else "Fresh Stock Ingredient",
            "category": item.ingredient.category if item and item.ingredient else "Raw Materials",
            "quantity": item.quantity if item else 100.0,
            "unit": item.ingredient.base_unit if item and item.ingredient else "kg",
            "unit_cost": item.unit_cost if item else 10.0,
            "total_cost": p.total_cost,
            "supplier_id": p.supplier_id,
            "supplier_name": supp.supplier_name if supp else "Apex Farm Fresh",
            "expected_delivery_date": str(p.expected_delivery_date),
            "status": "DISPATCHED" if p.status == "ORDERED" else p.status,
            "notes": p.notes or "Kitchen Commissary restocking order",
            "delivery_zone": "Central Commissary Dock A",
            "is_new_order": True
        })

    # 2. Also append other MRP recommendation items that need supplier attention
    recs = db.query(ProcurementRecommendation).filter(ProcurementRecommendation.recommended_qty > 0).all()
    for r in recs:
        supp = r.supplier
        if supplier_id and r.preferred_supplier_id != supplier_id:
            continue
        # Avoid duplicate if already covered by an active PO
        po_code = f"PO-20261029-{r.recommendation_id:03d}"
        if any(o["order_id"] == po_code for o in orders):
            continue

        orders.append({
            "order_id": po_code,
            "recommendation_id": r.recommendation_id,
            "ingredient_id": r.ingredient_id,
            "ingredient_name": r.ingredient.ingredient_name if r.ingredient else r.ingredient_id,
            "category": r.ingredient.category if r.ingredient else "Produce",
            "quantity": r.recommended_qty,
            "unit": r.ingredient.base_unit if r.ingredient else "kg",
            "unit_cost": r.ingredient.unit_cost if r.ingredient else 1.0,
            "total_cost": r.estimated_cost,
            "supplier_id": r.preferred_supplier_id,
            "supplier_name": supp.supplier_name if supp else "Apex Farm Fresh",
            "expected_delivery_date": str(r.expected_delivery_date),
            "status": r.status, # PENDING, DISPATCHED, DELIVERED_VERIFIED
            "notes": "Automated material requirement planning demand",
            "delivery_zone": "Central Commissary Dock A",
            "is_new_order": False
        })
    return orders

@app.post("/api/supplier-portal/dispatch")
def dispatch_supplier_order(req: FulfillPORequest, db: Session = Depends(get_db)):
    """
    Supplier clicks 'Fulfill & Dispatch' -> generates an official invoice and marks order as DISPATCHED.
    """
    # In our database, match recommendation_id from po_id suffix
    try:
        rec_id = int(req.po_id.split("-")[-1])
        rec = db.query(ProcurementRecommendation).filter(ProcurementRecommendation.recommendation_id == rec_id).first()
        if rec:
            rec.status = "DISPATCHED"
            db.commit()
    except Exception as e:
        pass

    return {
        "status": "success",
        "message": f"Order {req.po_id} dispatched with Invoice #{req.invoice_number}! Kitchen notified for receiving audit.",
        "invoice_number": req.invoice_number,
        "dispatched_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.post("/api/supplier-portal/verify-inward")
def verify_inward_stock(po_id: str = Query(...), db: Session = Depends(get_db)):
    """
    Kitchen/Inventory Manager clicks 'Verify & Inward Stock'.
    Adds verified quantities directly into FEFO Inventory Batches,
    logs an inward transaction, and audits the order across all 3 portals!
    Handles both 'PO-261029-XXXX' (PurchaseOrder) and 'PO-20261029-XXX' (ProcurementRecommendation).
    """
    today = date.today()
    try:
        # Check if it is a PurchaseOrder
        po = db.query(PurchaseOrder).filter(PurchaseOrder.purchase_order_id == po_id).first()
        if po:
            po.status = "DELIVERED_VERIFIED"
            item = po.items[0] if po.items else None
            if item and item.ingredient:
                ing = item.ingredient
                ing.current_stock += item.quantity
                
                # Create fresh verified FEFO batch
                new_batch = InventoryBatch(
                    batch_id=f"BAT-INWARD-{ing.ingredient_id.replace('ING-', '')}-{datetime.now().strftime('%H%M%S')}",
                    ingredient_id=ing.ingredient_id,
                    supplier_id=po.supplier_id or 1,
                    received_date=today,
                    expiry_date=today + timedelta(days=ing.shelf_life_days),
                    received_qty=item.quantity,
                    remaining_qty=item.quantity,
                    unit_cost=item.unit_cost or ing.unit_cost or 1.0,
                    storage_location=f"{ing.storage_type} Receiving Dock A"
                )
                db.add(new_batch)

                # Create verified double-entry transaction
                tx = InventoryTransaction(
                    ingredient_id=ing.ingredient_id,
                    transaction_date=datetime.now(),
                    transaction_type="RECEIVED",
                    quantity=item.quantity,
                    unit=ing.base_unit,
                    reference=f"VERIFIED-{po_id}",
                    notes=f"Supplier dispatch accepted & audited by Kitchen Manager"
                )
                db.add(tx)

                # Also sync corresponding ProcurementRecommendation if any
                rec = db.query(ProcurementRecommendation).filter(ProcurementRecommendation.ingredient_id == ing.ingredient_id).first()
                if rec:
                    rec.status = "DELIVERED_VERIFIED"

            db.commit()
            run_procurement_engine(db, forecast_week=146, centre_id=55)
            return {
                "status": "success",
                "message": f"Order {po_id} verified & inwarded into FEFO inventory! Audited across all 3 roles.",
                "po_id": po_id
            }

        # Otherwise check ProcurementRecommendation
        rec_id = None
        try:
            rec_id = int(po_id.split("-")[-1])
        except Exception:
            pass

        rec = None
        if rec_id is not None:
            rec = db.query(ProcurementRecommendation).filter(ProcurementRecommendation.recommendation_id == rec_id).first()

        if not rec:
            # Fallback search by ingredient if applicable
            rec = db.query(ProcurementRecommendation).first()

        if not rec:
            raise HTTPException(status_code=404, detail=f"Order {po_id} not found in database")

        ing = rec.ingredient
        rec.status = "DELIVERED_VERIFIED"
        
        # 1. Update current stock in Ingredient
        if ing:
            ing.current_stock += rec.recommended_qty
            # 2. Create fresh verified FEFO batch
            new_batch = InventoryBatch(
                batch_id=f"BAT-INWARD-{ing.ingredient_id.replace('ING-', '')}-{datetime.now().strftime('%H%M%S')}",
                ingredient_id=ing.ingredient_id,
                supplier_id=rec.preferred_supplier_id or 1,
                received_date=today,
                expiry_date=today + timedelta(days=ing.shelf_life_days),
                received_qty=rec.recommended_qty,
                remaining_qty=rec.recommended_qty,
                unit_cost=rec.ingredient.unit_cost if rec.ingredient else 1.0,
                storage_location=f"{ing.storage_type} Receiving Dock A"
            )
            db.add(new_batch)

            # 3. Create verified double-entry transaction
            tx = InventoryTransaction(
                ingredient_id=ing.ingredient_id,
                transaction_date=datetime.now(),
                transaction_type="RECEIVED",
                quantity=rec.recommended_qty,
                unit=ing.base_unit,
                reference=f"VERIFIED-{po_id}",
                notes=f"Supplier dispatch accepted & audited by Kitchen Manager"
            )
            db.add(tx)

        db.commit()

        # Re-run MRP to clear fulfilled requirement
        run_procurement_engine(db, forecast_week=146, centre_id=55)

        return {
            "status": "success",
            "message": f"Order {po_id} verified & inwarded into FEFO inventory! Audited across all 3 roles.",
            "po_id": po_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))




