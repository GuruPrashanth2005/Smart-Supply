import datetime
from datetime import date, timedelta
from .database import SessionLocal, init_db
from .models import (
    Meal, Ingredient, Recipe, RecipeIngredient,
    Supplier, SupplierIngredient, InventoryBatch,
    InventoryTransaction, DemandForecast, ProcurementRecommendation,
    RescueCampaign
)

def seed_database():
    init_db()
    db = SessionLocal()

    # Check if already seeded
    if db.query(Meal).count() > 0:
        db.close()
        return {"status": "already_seeded"}

    print("Seeding initial data...")

    # 1. SUPPLIERS
    suppliers = [
        Supplier(
            supplier_id=1,
            supplier_name="Apex Farm Fresh Produce",
            contact_details="orders@apexfresh.com | +1-800-555-0191",
            lead_time_days=2,
            minimum_order_qty=15.0,
            on_time_delivery_pct=96.5,
            quality_score=4.9,
            preferred_status=True
        ),
        Supplier(
            supplier_id=2,
            supplier_name="Golden Valley Poultry & Meats",
            contact_details="supply@goldenvalleymeats.com | +1-800-555-0144",
            lead_time_days=3,
            minimum_order_qty=20.0,
            on_time_delivery_pct=88.0, # Flaky supplier example
            quality_score=4.6,
            preferred_status=True
        ),
        Supplier(
            supplier_id=3,
            supplier_name="Pantry Chef Bulk Staples & Grains",
            contact_details="sales@pantrychefstaples.com | +1-800-555-0178",
            lead_time_days=4,
            minimum_order_qty=25.0,
            on_time_delivery_pct=98.0,
            quality_score=4.8,
            preferred_status=True
        ),
        Supplier(
            supplier_id=4,
            supplier_name="Dairy Best Artisanal Co.",
            contact_details="dispatch@dairybest.com | +1-800-555-0122",
            lead_time_days=1,
            minimum_order_qty=10.0,
            on_time_delivery_pct=94.0,
            quality_score=4.9,
            preferred_status=True
        ),
    ]
    db.add_all(suppliers)
    db.commit()

    # 2. INGREDIENTS (Centralized Inventory Master)
    # prep_yield_pct accounts for peeling, trimming and cooking losses
    # storage_type: Dry, Chilled, Frozen
    ingredients = [
        Ingredient(
            ingredient_id="ING-CHK",
            ingredient_name="Fresh Chicken Breast",
            category="Meat & Poultry",
            base_unit="kg",
            opening_stock=45.0,
            current_stock=38.0,
            reorder_level=25.0,
            safety_stock=15.0,
            shelf_life_days=5,
            unit_cost=6.50,
            supplier_lead_time_days=3,
            storage_type="Chilled",
            prep_yield_pct=0.88, # 12% trim loss
            preferred_supplier_id=2
        ),
        Ingredient(
            ingredient_id="ING-RICE",
            ingredient_name="Basmati Rice (Aged)",
            category="Grains & Staples",
            base_unit="kg",
            opening_stock=120.0,
            current_stock=95.0,
            reorder_level=40.0,
            safety_stock=20.0,
            shelf_life_days=365,
            unit_cost=2.20,
            supplier_lead_time_days=4,
            storage_type="Dry",
            prep_yield_pct=1.00,
            preferred_supplier_id=3
        ),
        Ingredient(
            ingredient_id="ING-ONION",
            ingredient_name="Yellow Cooking Onions",
            category="Produce",
            base_unit="kg",
            opening_stock=30.0,
            current_stock=12.0, # Below reorder level!
            reorder_level=20.0,
            safety_stock=10.0,
            shelf_life_days=21,
            unit_cost=1.10,
            supplier_lead_time_days=2,
            storage_type="Dry",
            prep_yield_pct=0.84, # 16% peel/root waste
            preferred_supplier_id=1
        ),
        Ingredient(
            ingredient_id="ING-TOMATO",
            ingredient_name="Ripe Roma Tomatoes",
            category="Produce",
            base_unit="kg",
            opening_stock=25.0,
            current_stock=18.0, # At risk of expiry in 3 days!
            reorder_level=15.0,
            safety_stock=8.0,
            shelf_life_days=6,
            unit_cost=2.40,
            supplier_lead_time_days=2,
            storage_type="Chilled",
            prep_yield_pct=0.92,
            preferred_supplier_id=1
        ),
        Ingredient(
            ingredient_id="ING-PANEER",
            ingredient_name="Fresh Cottage Cheese (Paneer)",
            category="Dairy",
            base_unit="kg",
            opening_stock=20.0,
            current_stock=14.0,
            reorder_level=12.0,
            safety_stock=6.0,
            shelf_life_days=7,
            unit_cost=7.00,
            supplier_lead_time_days=1,
            storage_type="Chilled",
            prep_yield_pct=0.98,
            preferred_supplier_id=4
        ),
        Ingredient(
            ingredient_id="ING-TOFU",
            ingredient_name="Organic Firm Tofu",
            category="Plant-Based Protein",
            base_unit="kg",
            opening_stock=15.0,
            current_stock=12.0,
            reorder_level=8.0,
            safety_stock=4.0,
            shelf_life_days=14,
            unit_cost=4.50,
            supplier_lead_time_days=2,
            storage_type="Chilled",
            prep_yield_pct=0.95,
            preferred_supplier_id=4
        ),
        Ingredient(
            ingredient_id="ING-CREAM",
            ingredient_name="Heavy Cooking Cream (35%)",
            category="Dairy",
            base_unit="L",
            opening_stock=18.0,
            current_stock=9.0, # Critical low stock!
            reorder_level=12.0,
            safety_stock=5.0,
            shelf_life_days=10,
            unit_cost=3.80,
            supplier_lead_time_days=1,
            storage_type="Chilled",
            prep_yield_pct=0.99,
            preferred_supplier_id=4
        ),
        Ingredient(
            ingredient_id="ING-GARLIC",
            ingredient_name="Peeled Garlic Cloves",
            category="Produce",
            base_unit="kg",
            opening_stock=8.0,
            current_stock=5.5,
            reorder_level=4.0,
            safety_stock=2.0,
            shelf_life_days=20,
            unit_cost=4.20,
            supplier_lead_time_days=2,
            storage_type="Chilled",
            prep_yield_pct=0.96,
            preferred_supplier_id=1
        ),
        Ingredient(
            ingredient_id="ING-MOZZ",
            ingredient_name="Shredded Mozzarella Cheese",
            category="Dairy",
            base_unit="kg",
            opening_stock=35.0,
            current_stock=28.0,
            reorder_level=20.0,
            safety_stock=10.0,
            shelf_life_days=15,
            unit_cost=8.20,
            supplier_lead_time_days=2,
            storage_type="Chilled",
            prep_yield_pct=1.00,
            preferred_supplier_id=4
        ),
        Ingredient(
            ingredient_id="ING-FLOUR",
            ingredient_name="High-Protein Pizza & Bread Flour",
            category="Grains & Staples",
            base_unit="kg",
            opening_stock=150.0,
            current_stock=110.0,
            reorder_level=50.0,
            safety_stock=25.0,
            shelf_life_days=180,
            unit_cost=1.15,
            supplier_lead_time_days=4,
            storage_type="Dry",
            prep_yield_pct=1.00,
            preferred_supplier_id=3
        ),
        Ingredient(
            ingredient_id="ING-OLIVEOIL",
            ingredient_name="Extra Virgin Olive Oil",
            category="Oils & Condiments",
            base_unit="L",
            opening_stock=40.0,
            current_stock=32.0,
            reorder_level=15.0,
            safety_stock=8.0,
            shelf_life_days=360,
            unit_cost=9.50,
            supplier_lead_time_days=3,
            storage_type="Dry",
            prep_yield_pct=1.00,
            preferred_supplier_id=3
        ),
        Ingredient(
            ingredient_id="ING-SPICE-GARAM",
            ingredient_name="Artisanal Garam Masala Blend",
            category="Spices",
            base_unit="kg",
            opening_stock=5.0,
            current_stock=4.1,
            reorder_level=2.0,
            safety_stock=1.0,
            shelf_life_days=180,
            unit_cost=14.00,
            supplier_lead_time_days=3,
            storage_type="Dry",
            prep_yield_pct=1.00,
            preferred_supplier_id=3
        ),
        Ingredient(
            ingredient_id="ING-BELLPEPPER",
            ingredient_name="Mixed Bell Peppers",
            category="Produce",
            base_unit="kg",
            opening_stock=15.0,
            current_stock=11.0,
            reorder_level=10.0,
            safety_stock=5.0,
            shelf_life_days=7,
            unit_cost=3.20,
            supplier_lead_time_days=2,
            storage_type="Chilled",
            prep_yield_pct=0.86,
            preferred_supplier_id=1
        ),
        Ingredient(
            ingredient_id="ING-PASTA",
            ingredient_name="Durum Wheat Penne Rigate",
            category="Grains & Staples",
            base_unit="kg",
            opening_stock=80.0,
            current_stock=64.0,
            reorder_level=30.0,
            safety_stock=15.0,
            shelf_life_days=365,
            unit_cost=1.80,
            supplier_lead_time_days=3,
            storage_type="Dry",
            prep_yield_pct=1.00,
            preferred_supplier_id=3
        )
    ]
    db.add_all(ingredients)
    db.commit()

    # 3. SUPPLIER INGREDIENT PRICING & PACK SIZES
    supplier_items = [
        SupplierIngredient(supplier_id=1, ingredient_id="ING-ONION", unit_cost=1.10, minimum_order_qty=15.0, pack_size=5.0, lead_time_days=2, is_preferred=True),
        SupplierIngredient(supplier_id=1, ingredient_id="ING-TOMATO", unit_cost=2.40, minimum_order_qty=10.0, pack_size=5.0, lead_time_days=2, is_preferred=True),
        SupplierIngredient(supplier_id=1, ingredient_id="ING-GARLIC", unit_cost=4.20, minimum_order_qty=5.0, pack_size=2.0, lead_time_days=2, is_preferred=True),
        SupplierIngredient(supplier_id=1, ingredient_id="ING-BELLPEPPER", unit_cost=3.20, minimum_order_qty=10.0, pack_size=5.0, lead_time_days=2, is_preferred=True),

        SupplierIngredient(supplier_id=2, ingredient_id="ING-CHK", unit_cost=6.50, minimum_order_qty=20.0, pack_size=10.0, lead_time_days=3, is_preferred=True),
        
        SupplierIngredient(supplier_id=3, ingredient_id="ING-RICE", unit_cost=2.20, minimum_order_qty=25.0, pack_size=25.0, lead_time_days=4, is_preferred=True),
        SupplierIngredient(supplier_id=3, ingredient_id="ING-FLOUR", unit_cost=1.15, minimum_order_qty=50.0, pack_size=25.0, lead_time_days=4, is_preferred=True),
        SupplierIngredient(supplier_id=3, ingredient_id="ING-PASTA", unit_cost=1.80, minimum_order_qty=20.0, pack_size=10.0, lead_time_days=3, is_preferred=True),
        SupplierIngredient(supplier_id=3, ingredient_id="ING-OLIVEOIL", unit_cost=9.50, minimum_order_qty=10.0, pack_size=5.0, lead_time_days=3, is_preferred=True),
        SupplierIngredient(supplier_id=3, ingredient_id="ING-SPICE-GARAM", unit_cost=14.00, minimum_order_qty=2.0, pack_size=1.0, lead_time_days=3, is_preferred=True),

        SupplierIngredient(supplier_id=4, ingredient_id="ING-PANEER", unit_cost=7.00, minimum_order_qty=10.0, pack_size=5.0, lead_time_days=1, is_preferred=True),
        SupplierIngredient(supplier_id=4, ingredient_id="ING-TOFU", unit_cost=4.50, minimum_order_qty=5.0, pack_size=5.0, lead_time_days=2, is_preferred=True),
        SupplierIngredient(supplier_id=4, ingredient_id="ING-CREAM", unit_cost=3.80, minimum_order_qty=10.0, pack_size=5.0, lead_time_days=1, is_preferred=True),
        SupplierIngredient(supplier_id=4, ingredient_id="ING-MOZZ", unit_cost=8.20, minimum_order_qty=10.0, pack_size=5.0, lead_time_days=2, is_preferred=True),
    ]
    db.add_all(supplier_items)
    db.commit()

    # 4. MEALS (Matching Kaggle IDs)
    meals = [
        Meal(meal_id=1885, meal_name="Butter Chicken & Basmati Rice Bowl", category="Rice Bowl", cuisine="Indian", base_price=280.0),
        Meal(meal_id=1993, meal_name="Royal Shahi Paneer with Biryani Rice", category="Rice Bowl", cuisine="Indian", base_price=260.0),
        Meal(meal_id=2539, meal_name="Artisan Stone-Baked Margherita Pizza", category="Pizza", cuisine="Italian", base_price=320.0),
        Meal(meal_id=2139, meal_name="Creamy Tuscan Garlic Chicken Pasta", category="Pasta", cuisine="Italian", base_price=290.0),
        Meal(meal_id=2631, meal_name="Roasted Bell Pepper & Tomato Bisque", category="Soup", cuisine="Continental", base_price=180.0),
        Meal(meal_id=1248, meal_name="Crispy Tofu & Teriyaki Rice Bowl", category="Rice Bowl", cuisine="Thai", base_price=240.0),
    ]
    db.add_all(meals)
    db.commit()

    # 5. RECIPES & BOM MAPPINGS (Shared ingredient quantities per serving)
    recipes = [
        Recipe(recipe_id=1, meal_id=1885, recipe_name="Signature Butter Chicken Rice Bowl", serving_basis=1, prep_time_mins=25),
        Recipe(recipe_id=2, meal_id=1993, recipe_name="Royal Shahi Paneer Rice Bowl", serving_basis=1, prep_time_mins=20),
        Recipe(recipe_id=3, meal_id=2539, recipe_name="Margherita Pizza 11-inch", serving_basis=1, prep_time_mins=15),
        Recipe(recipe_id=4, meal_id=2139, recipe_name="Tuscan Garlic Chicken Pasta", serving_basis=1, prep_time_mins=18),
        Recipe(recipe_id=5, meal_id=2631, recipe_name="Creamy Tomato Bell Pepper Soup", serving_basis=1, prep_time_mins=15),
        Recipe(recipe_id=6, meal_id=1248, recipe_name="Crispy Teriyaki Tofu Rice Bowl", serving_basis=1, prep_time_mins=20),
    ]
    db.add_all(recipes)
    db.commit()

    # Recipe Ingredients: (recipe_id, ingredient_id, qty_per_serving, unit, substitute_id)
    # Notice how Onions, Tomatoes, Cream and Rice are shared across multiple recipes!
    bom_items = [
        # Recipe 1: Butter Chicken Bowl
        RecipeIngredient(recipe_id=1, ingredient_id="ING-CHK", quantity_per_serving=0.180, unit="kg"),
        RecipeIngredient(recipe_id=1, ingredient_id="ING-RICE", quantity_per_serving=0.150, unit="kg"),
        RecipeIngredient(recipe_id=1, ingredient_id="ING-ONION", quantity_per_serving=0.060, unit="kg"),
        RecipeIngredient(recipe_id=1, ingredient_id="ING-TOMATO", quantity_per_serving=0.080, unit="kg"),
        RecipeIngredient(recipe_id=1, ingredient_id="ING-CREAM", quantity_per_serving=0.040, unit="L"),
        RecipeIngredient(recipe_id=1, ingredient_id="ING-GARLIC", quantity_per_serving=0.015, unit="kg"),
        RecipeIngredient(recipe_id=1, ingredient_id="ING-SPICE-GARAM", quantity_per_serving=0.008, unit="kg"),

        # Recipe 2: Shahi Paneer Bowl (Shared Onion, Tomato, Cream, Rice, Garlic; Substitute = Tofu)
        RecipeIngredient(recipe_id=2, ingredient_id="ING-PANEER", quantity_per_serving=0.160, unit="kg", substitute_ingredient_id="ING-TOFU"),
        RecipeIngredient(recipe_id=2, ingredient_id="ING-RICE", quantity_per_serving=0.150, unit="kg"),
        RecipeIngredient(recipe_id=2, ingredient_id="ING-ONION", quantity_per_serving=0.050, unit="kg"),
        RecipeIngredient(recipe_id=2, ingredient_id="ING-TOMATO", quantity_per_serving=0.070, unit="kg"),
        RecipeIngredient(recipe_id=2, ingredient_id="ING-CREAM", quantity_per_serving=0.045, unit="L"),
        RecipeIngredient(recipe_id=2, ingredient_id="ING-GARLIC", quantity_per_serving=0.012, unit="kg"),
        RecipeIngredient(recipe_id=2, ingredient_id="ING-SPICE-GARAM", quantity_per_serving=0.006, unit="kg"),

        # Recipe 3: Margherita Pizza
        RecipeIngredient(recipe_id=3, ingredient_id="ING-FLOUR", quantity_per_serving=0.180, unit="kg"),
        RecipeIngredient(recipe_id=3, ingredient_id="ING-TOMATO", quantity_per_serving=0.090, unit="kg"),
        RecipeIngredient(recipe_id=3, ingredient_id="ING-MOZZ", quantity_per_serving=0.120, unit="kg"),
        RecipeIngredient(recipe_id=3, ingredient_id="ING-OLIVEOIL", quantity_per_serving=0.015, unit="L"),
        RecipeIngredient(recipe_id=3, ingredient_id="ING-GARLIC", quantity_per_serving=0.005, unit="kg"),

        # Recipe 4: Tuscan Chicken Pasta
        RecipeIngredient(recipe_id=4, ingredient_id="ING-PASTA", quantity_per_serving=0.140, unit="kg"),
        RecipeIngredient(recipe_id=4, ingredient_id="ING-CHK", quantity_per_serving=0.120, unit="kg"),
        RecipeIngredient(recipe_id=4, ingredient_id="ING-CREAM", quantity_per_serving=0.050, unit="L"),
        RecipeIngredient(recipe_id=4, ingredient_id="ING-GARLIC", quantity_per_serving=0.015, unit="kg"),
        RecipeIngredient(recipe_id=4, ingredient_id="ING-OLIVEOIL", quantity_per_serving=0.010, unit="L"),
        RecipeIngredient(recipe_id=4, ingredient_id="ING-BELLPEPPER", quantity_per_serving=0.040, unit="kg"),

        # Recipe 5: Tomato Bell Pepper Soup
        RecipeIngredient(recipe_id=5, ingredient_id="ING-TOMATO", quantity_per_serving=0.160, unit="kg"),
        RecipeIngredient(recipe_id=5, ingredient_id="ING-BELLPEPPER", quantity_per_serving=0.070, unit="kg"),
        RecipeIngredient(recipe_id=5, ingredient_id="ING-ONION", quantity_per_serving=0.040, unit="kg"),
        RecipeIngredient(recipe_id=5, ingredient_id="ING-CREAM", quantity_per_serving=0.030, unit="L"),
        RecipeIngredient(recipe_id=5, ingredient_id="ING-GARLIC", quantity_per_serving=0.010, unit="kg"),

        # Recipe 6: Teriyaki Tofu Rice Bowl
        RecipeIngredient(recipe_id=6, ingredient_id="ING-TOFU", quantity_per_serving=0.170, unit="kg", substitute_ingredient_id="ING-PANEER"),
        RecipeIngredient(recipe_id=6, ingredient_id="ING-RICE", quantity_per_serving=0.150, unit="kg"),
        RecipeIngredient(recipe_id=6, ingredient_id="ING-BELLPEPPER", quantity_per_serving=0.050, unit="kg"),
        RecipeIngredient(recipe_id=6, ingredient_id="ING-ONION", quantity_per_serving=0.030, unit="kg"),
        RecipeIngredient(recipe_id=6, ingredient_id="ING-GARLIC", quantity_per_serving=0.010, unit="kg"),
    ]
    db.add_all(bom_items)
    db.commit()

    # 6. INVENTORY BATCHES (Including 2 batches expiring in 2-3 days for FEFO & Spoilage Rescue!)
    today = date.today()
    batches = [
        # Tomatoes: 12 kg expiring in 3 days!
        InventoryBatch(
            batch_id="BAT-TOM-01",
            ingredient_id="ING-TOMATO",
            supplier_id=1,
            received_date=today - timedelta(days=3),
            expiry_date=today + timedelta(days=3),
            received_qty=20.0,
            remaining_qty=12.0,
            unit_cost=2.40,
            storage_location="Cooler Rack A2"
        ),
        InventoryBatch(
            batch_id="BAT-TOM-02",
            ingredient_id="ING-TOMATO",
            supplier_id=1,
            received_date=today - timedelta(days=1),
            expiry_date=today + timedelta(days=6),
            received_qty=10.0,
            remaining_qty=6.0,
            unit_cost=2.40,
            storage_location="Cooler Rack A2"
        ),

        # Chicken: 18 kg expiring in 2 days!
        InventoryBatch(
            batch_id="BAT-CHK-01",
            ingredient_id="ING-CHK",
            supplier_id=2,
            received_date=today - timedelta(days=3),
            expiry_date=today + timedelta(days=2),
            received_qty=25.0,
            remaining_qty=18.0,
            unit_cost=6.50,
            storage_location="Meat Chiller C1"
        ),
        InventoryBatch(
            batch_id="BAT-CHK-02",
            ingredient_id="ING-CHK",
            supplier_id=2,
            received_date=today - timedelta(days=1),
            expiry_date=today + timedelta(days=4),
            received_qty=20.0,
            remaining_qty=20.0,
            unit_cost=6.50,
            storage_location="Meat Chiller C1"
        ),

        # Heavy Cream: 9 L total remaining
        InventoryBatch(
            batch_id="BAT-CRM-01",
            ingredient_id="ING-CREAM",
            supplier_id=4,
            received_date=today - timedelta(days=4),
            expiry_date=today + timedelta(days=5),
            received_qty=15.0,
            remaining_qty=9.0,
            unit_cost=3.80,
            storage_location="Dairy Walk-in D1"
        ),

        # Yellow Onions: 12 kg remaining
        InventoryBatch(
            batch_id="BAT-ONN-01",
            ingredient_id="ING-ONION",
            supplier_id=1,
            received_date=today - timedelta(days=5),
            expiry_date=today + timedelta(days=16),
            received_qty=25.0,
            remaining_qty=12.0,
            unit_cost=1.10,
            storage_location="Dry Pantry Bin 4"
        ),

        # Rice
        InventoryBatch(
            batch_id="BAT-RIC-01",
            ingredient_id="ING-RICE",
            supplier_id=3,
            received_date=today - timedelta(days=10),
            expiry_date=today + timedelta(days=350),
            received_qty=100.0,
            remaining_qty=95.0,
            unit_cost=2.20,
            storage_location="Dry Pantry Pallet 1"
        ),

        # Mozzarella
        InventoryBatch(
            batch_id="BAT-MOZ-01",
            ingredient_id="ING-MOZZ",
            supplier_id=4,
            received_date=today - timedelta(days=2),
            expiry_date=today + timedelta(days=12),
            received_qty=30.0,
            remaining_qty=28.0,
            unit_cost=8.20,
            storage_location="Dairy Walk-in D2"
        ),
    ]
    db.add_all(batches)
    db.commit()

    # 7. INVENTORY TRANSACTIONS (Audited Ledger matching the user photo fields)
    transactions = [
        InventoryTransaction(
            ingredient_id="ING-CHK",
            batch_id="BAT-CHK-01",
            transaction_date=datetime.datetime.utcnow() - timedelta(days=3),
            transaction_type="RECEIVED",
            quantity=25.0,
            unit="kg",
            reference="PO-2026-042",
            notes="Initial shipment from Golden Valley Poultry"
        ),
        InventoryTransaction(
            ingredient_id="ING-CHK",
            batch_id="BAT-CHK-01",
            transaction_date=datetime.datetime.utcnow() - timedelta(days=2),
            transaction_type="CONSUMED",
            quantity=5.0,
            unit="kg",
            reference="Kitchen Batch Prep",
            notes="Dinner Service Butter Chicken"
        ),
        InventoryTransaction(
            ingredient_id="ING-CHK",
            batch_id="BAT-CHK-01",
            transaction_date=datetime.datetime.utcnow() - timedelta(days=1),
            transaction_type="CONSUMED",
            quantity=2.0,
            unit="kg",
            reference="Kitchen Batch Prep",
            notes="Lunch Service Tuscan Pasta"
        ),
        InventoryTransaction(
            ingredient_id="ING-TOMATO",
            batch_id="BAT-TOM-01",
            transaction_date=datetime.datetime.utcnow() - timedelta(days=3),
            transaction_type="RECEIVED",
            quantity=20.0,
            unit="kg",
            reference="PO-2026-043",
            notes="Apex Farm delivery crate"
        ),
        InventoryTransaction(
            ingredient_id="ING-TOMATO",
            batch_id="BAT-TOM-01",
            transaction_date=datetime.datetime.utcnow() - timedelta(days=2),
            transaction_type="CONSUMED",
            quantity=6.5,
            unit="kg",
            reference="Sauce Station",
            notes="Prep for Pizza Marinara and Soup"
        ),
        InventoryTransaction(
            ingredient_id="ING-TOMATO",
            batch_id="BAT-TOM-01",
            transaction_date=datetime.datetime.utcnow() - timedelta(days=1),
            transaction_type="WASTAGE",
            quantity=1.5,
            unit="kg",
            reference="Audit Log",
            notes="Bruised during transit / over-ripe"
        ),
        InventoryTransaction(
            ingredient_id="ING-ONION",
            batch_id="BAT-ONN-01",
            transaction_date=datetime.datetime.utcnow() - timedelta(days=2),
            transaction_type="CONSUMED",
            quantity=8.0,
            unit="kg",
            reference="Curry Base Prep",
            notes="Gravy batches for week"
        )
    ]
    db.add_all(transactions)
    db.commit()

    # 8. DEMAND FORECASTS (Week 146 predicted demand)
    # Reflecting realistic center #55 orders
    forecasts = [
        DemandForecast(meal_id=1885, centre_id=55, forecast_week=146, predicted_orders=380.0, baseline_orders=350.0, model_version="RandomForest-v1.2"),
        DemandForecast(meal_id=1993, centre_id=55, forecast_week=146, predicted_orders=290.0, baseline_orders=280.0, model_version="RandomForest-v1.2"),
        DemandForecast(meal_id=2539, centre_id=55, forecast_week=146, predicted_orders=420.0, baseline_orders=400.0, model_version="RandomForest-v1.2"),
        DemandForecast(meal_id=2139, centre_id=55, forecast_week=146, predicted_orders=260.0, baseline_orders=245.0, model_version="RandomForest-v1.2"),
        DemandForecast(meal_id=2631, centre_id=55, forecast_week=146, predicted_orders=190.0, baseline_orders=175.0, model_version="RandomForest-v1.2"),
        DemandForecast(meal_id=1248, centre_id=55, forecast_week=146, predicted_orders=180.0, baseline_orders=160.0, model_version="RandomForest-v1.2"),
    ]
    db.add_all(forecasts)
    db.commit()

    # 9. SPOILAGE RESCUE CAMPAIGN (Feature 1 Demo)
    rescue = RescueCampaign(
        ingredient_id="ING-TOMATO",
        batch_id="BAT-TOM-01",
        expiring_qty=12.0,
        expiry_date=today + timedelta(days=3),
        promoted_meal_id=2631, # Tomato Bell Pepper Soup
        suggested_discount_pct=20.0,
        projected_rescued_qty=10.5,
        status="ACTIVE"
    )
    db.add(rescue)
    db.commit()

    db.close()
    print("Database seeding completed successfully!")
    return {"status": "seeded_successfully"}

if __name__ == "__main__":
    seed_database()

