from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Meal(Base):
    __tablename__ = "meals"

    meal_id = Column(Integer, primary_key=True, index=True)
    meal_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    cuisine = Column(String(100), nullable=False, index=True)
    base_price = Column(Float, default=100.0)
    is_active = Column(Boolean, default=True)

    recipes = relationship("Recipe", back_populates="meal", cascade="all, delete-orphan")
    forecasts = relationship("DemandForecast", back_populates="meal")


class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id = Column(String(50), primary_key=True, index=True) # e.g. "ING-001" or string name
    ingredient_name = Column(String(150), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=False, index=True) # Produce, Dairy, Meat, Grains, Spices, Oils
    base_unit = Column(String(20), nullable=False) # kg, L, pcs, etc.
    opening_stock = Column(Float, default=0.0)
    current_stock = Column(Float, default=0.0)
    reorder_level = Column(Float, default=10.0)
    safety_stock = Column(Float, default=5.0)
    shelf_life_days = Column(Integer, default=7)
    unit_cost = Column(Float, default=1.0) # Cost per base_unit
    supplier_lead_time_days = Column(Integer, default=2)
    storage_type = Column(String(50), default="Chilled") # Dry, Chilled, Frozen
    prep_yield_pct = Column(Float, default=0.85) # Prep yield: 0.85 = 85% usable (peel/trim loss)
    preferred_supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    active_status = Column(Boolean, default=True)

    batches = relationship("InventoryBatch", back_populates="ingredient", cascade="all, delete-orphan")
    transactions = relationship("InventoryTransaction", back_populates="ingredient", cascade="all, delete-orphan")
    recipe_items = relationship("RecipeIngredient", back_populates="ingredient", foreign_keys="RecipeIngredient.ingredient_id")
    supplier_links = relationship("SupplierIngredient", back_populates="ingredient")


class Recipe(Base):
    __tablename__ = "recipes"

    recipe_id = Column(Integer, primary_key=True, autoincrement=True)
    meal_id = Column(Integer, ForeignKey("meals.meal_id"), nullable=False, index=True)
    recipe_name = Column(String(150), nullable=False)
    serving_basis = Column(Integer, default=1) # standard 1 serving
    prep_time_mins = Column(Integer, default=20)
    instructions = Column(Text, default="")
    active_status = Column(Boolean, default=True)

    meal = relationship("Meal", back_populates="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipe_id = Column(Integer, ForeignKey("recipes.recipe_id"), nullable=False, index=True)
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False, index=True)
    quantity_per_serving = Column(Float, nullable=False) # In base_unit
    unit = Column(String(20), nullable=False)
    substitute_ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=True) # Emergency swap

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", foreign_keys=[ingredient_id], back_populates="recipe_items")
    substitute = relationship("Ingredient", foreign_keys=[substitute_ingredient_id])


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    batch_id = Column(String(50), primary_key=True, index=True) # e.g. "BAT-2026-001"
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    received_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False, index=True)
    received_qty = Column(Float, nullable=False)
    remaining_qty = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    storage_location = Column(String(100), default="Main Walk-In")

    ingredient = relationship("Ingredient", back_populates="batches")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False, index=True)
    batch_id = Column(String(50), ForeignKey("inventory_batches.batch_id"), nullable=True)
    transaction_date = Column(DateTime, default=datetime.utcnow, index=True)
    transaction_type = Column(String(50), nullable=False) # RECEIVED, CONSUMED, WASTAGE, ADJUSTMENT, TRANSFER
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    reference = Column(String(100), default="") # e.g. "PO-1002" or "Order #1885 Batch Prep"
    notes = Column(Text, default="")

    ingredient = relationship("Ingredient", back_populates="transactions")


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_name = Column(String(150), nullable=False)
    contact_details = Column(String(200), default="")
    lead_time_days = Column(Integer, default=2)
    minimum_order_qty = Column(Float, default=10.0)
    on_time_delivery_pct = Column(Float, default=95.0) # Supplier reliability scorecard
    quality_score = Column(Float, default=4.8) # 1.0 to 5.0
    preferred_status = Column(Boolean, default=True)

    supplier_ingredients = relationship("SupplierIngredient", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class SupplierIngredient(Base):
    __tablename__ = "supplier_ingredients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=False)
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False)
    unit_cost = Column(Float, nullable=False)
    minimum_order_qty = Column(Float, default=5.0)
    pack_size = Column(Float, default=5.0) # Crates/Cases of 5kg, 10kg
    lead_time_days = Column(Integer, default=2)
    is_preferred = Column(Boolean, default=False)

    supplier = relationship("Supplier", back_populates="supplier_ingredients")
    ingredient = relationship("Ingredient", back_populates="supplier_links")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    purchase_order_id = Column(String(50), primary_key=True, index=True) # e.g. "PO-2026-001"
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=False)
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=False)
    status = Column(String(50), default="DRAFT") # DRAFT, APPROVED, ORDERED, RECEIVED, CANCELLED
    total_cost = Column(Float, default=0.0)
    notes = Column(Text, default="")

    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    purchase_order_id = Column(String(50), ForeignKey("purchase_orders.purchase_order_id"), nullable=False)
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    received_qty = Column(Float, default=0.0)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    ingredient = relationship("Ingredient")


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    forecast_id = Column(Integer, primary_key=True, autoincrement=True)
    meal_id = Column(Integer, ForeignKey("meals.meal_id"), nullable=False, index=True)
    centre_id = Column(Integer, default=55, index=True)
    forecast_week = Column(Integer, nullable=False, index=True)
    predicted_orders = Column(Float, nullable=False)
    baseline_orders = Column(Float, default=0.0)
    model_version = Column(String(150), default="RandomForest-v1.0")
    generated_at = Column(DateTime, default=datetime.utcnow)

    meal = relationship("Meal", back_populates="forecasts")


class ProcurementRecommendation(Base):
    __tablename__ = "procurement_recommendations"

    recommendation_id = Column(Integer, primary_key=True, autoincrement=True)
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False)
    forecast_week = Column(Integer, default=146)
    gross_requirement = Column(Float, nullable=False) # Raw recipe sum
    yield_adjusted_requirement = Column(Float, nullable=False) # Accounts for peeling/trim loss
    available_stock = Column(Float, nullable=False) # Current unexpired stock
    incoming_stock = Column(Float, default=0.0) # Pending POs
    safety_stock = Column(Float, default=0.0)
    net_requirement = Column(Float, nullable=False)
    recommended_qty = Column(Float, nullable=False) # Rounded to MOQ / pack size
    pack_size = Column(Float, default=1.0)
    estimated_cost = Column(Float, nullable=False)
    suggested_order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=False)
    preferred_supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, ORDERED

    ingredient = relationship("Ingredient")
    supplier = relationship("Supplier")


class RescueCampaign(Base):
    __tablename__ = "rescue_campaigns"

    campaign_id = Column(Integer, primary_key=True, autoincrement=True)
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False)
    batch_id = Column(String(50), nullable=False)
    expiring_qty = Column(Float, nullable=False)
    expiry_date = Column(Date, nullable=False)
    promoted_meal_id = Column(Integer, ForeignKey("meals.meal_id"), nullable=False)
    suggested_discount_pct = Column(Float, default=20.0) # e.g. 20% off
    projected_rescued_qty = Column(Float, nullable=False)
    status = Column(String(50), default="ACTIVE") # ACTIVE, APPLIED, DISMISSED

    ingredient = relationship("Ingredient")
    promoted_meal = relationship("Meal")


class PromoPlan(Base):
    __tablename__ = "promo_plans"

    promo_id = Column(Integer, primary_key=True, autoincrement=True)
    meal_id = Column(Integer, ForeignKey("meals.meal_id"), nullable=False)
    promo_type = Column(String(50), nullable=False) # BOGO (1+1), FLAT_DISCOUNT, COMPLIMENTARY_ITEM
    promo_name = Column(String(150), nullable=False)
    target_date = Column(Date, nullable=False)
    target_daypart = Column(String(50), default="LUNCH") # MORNING, BRUNCH, LUNCH, EVENING, NIGHT, FULL_DAY
    complimentary_meal_id = Column(Integer, ForeignKey("meals.meal_id"), nullable=True)
    discount_pct = Column(Float, default=50.0)
    expected_order_multiplier = Column(Float, default=2.1) # e.g. 2.1x normal demand
    notes = Column(Text, default="")
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, NOTIFIED_KITCHEN, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    meal = relationship("Meal", foreign_keys=[meal_id])
    complimentary_meal = relationship("Meal", foreign_keys=[complimentary_meal_id])


class DailyStockLedger(Base):
    __tablename__ = "daily_stock_ledger"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    ingredient_id = Column(String(50), ForeignKey("ingredients.ingredient_id"), nullable=False, index=True)
    ingredient_name = Column(String(150), nullable=False)
    unit = Column(String(20), nullable=False)
    opening_stock = Column(Float, nullable=False, default=0.0)
    received_qty = Column(Float, nullable=False, default=0.0)
    used_qty = Column(Float, nullable=False, default=0.0)
    wasted_qty = Column(Float, nullable=False, default=0.0)
    closing_stock = Column(Float, nullable=False, default=0.0)
    shelf_life_days = Column(Integer, nullable=False, default=7)
    supplier_lead_time_days = Column(Integer, nullable=False, default=2)
    unit_cost = Column(Float, nullable=False, default=10.0)
    total_valuation = Column(Float, nullable=False, default=0.0)

    ingredient = relationship("Ingredient")



