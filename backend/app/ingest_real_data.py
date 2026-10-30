import os
import random
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from .models import (
    DailyStockLedger,
    Base, Meal, Ingredient, Recipe, RecipeIngredient,
    Supplier, SupplierIngredient, InventoryBatch,
    InventoryTransaction, DemandForecast,
    RescueCampaign
)
from .engine import run_procurement_engine
from .ml_service import forecasting_service

# Realistic culinary dish names mapped to exact Kaggle Meal IDs
MEAL_NAME_MAPPING = {
    # Thai Beverages & Extras
    1885: "Thai Sweet Iced Milk Tea",
    1993: "Lemongrass Herbal Cooler",
    2539: "Thai Coconut Palm Shake",
    1311: "Crispy Spring Roll Dippers",
    1803: "Sweet Chilli Dip & Wafers",
    1198: "Golden Sesame Prawn Crackers",
    
    # Indian Beverages
    1248: "Royal Saffron Masala Chai",
    2631: "Thick Mango Kesar Lassi",
    2139: "Spiced Buttermilk (Chaas)",

    # Italian Beverages & Salads
    1062: "Classic Italian Espresso Roast",
    1778: "Iced Caramel Macchiato",
    2707: "Sparkling Lemon Basil Soda",
    2490: "Caesar Salad with Parmesan Shavings",
    2664: "Mediterranean Greek Olive Salad",
    2569: "Caprese Salad with Basil Pesto",

    # Continental Beverages
    1230: "Cold Pressed Valencia Orange Juice",
    1207: "Berry Blast Greek Yogurt Smoothie",
    2322: "Dark Belgian Hot Chocolate",

    # Soups & Snacks
    1847: "Spicy Thai Tom Yum Soup",
    1438: "Creamy Coconut Chicken Galangal Soup",
    2494: "Clear Sweet Corn & Vegetable Soup",
    2760: "Crispy Fried Vegetable Wantons",
    1525: "Steamed Chicken Dimsums",
    2704: "Corn Cheese Cocktail Bites",

    # Indian Rice Bowls & Biryanis
    1109: "Paneer Butter Masala Rice Bowl",
    2290: "Dal Makhani & Jeera Rice Bowl",
    1727: "Tender Mutton Rogan Josh Rice Bowl",
    1902: "Hyderabadi Chicken Dum Biryani",
    1247: "Royal Lucknowi Paneer Biryani",
    1770: "Kolkata Egg & Potato Dum Biryani",

    # Starters & Sandwiches
    1878: "Peri Peri Chicken Skewers",
    2640: "Crispy Paneer Popcorn",
    2577: "Grilled Chicken Satay with Peanut Dip",
    1754: "Italian Grilled Pesto Chicken Sandwich",
    1971: "Toasted Tomato Mozzarella Panini",
    2826: "Double Cheese Smoked Veggie Club",

    # Italian Pastas & Pizzas
    2306: "Creamy Alfredo Penne with Mushrooms",
    1216: "Fiery Chicken Penne Arrabbiata",
    2126: "Classic Tuscan Beef Bolognese Pasta",
    1558: "Farmhouse Margherita Pizza",
    2581: "Barbecue Chicken & Onion Pizza",
    1962: "Gourmet Pepperoni & Mozzarella Pizza",

    # Indian Desserts
    2492: "Warm Gulab Jamun with Rabdi",
    2304: "Kesar Pista Shahi Phirni",
    1543: "Bengali Rasgulla in Cardamom Syrup",

    # Continental Fish & Seafood
    1571: "Herb Butter Grilled Salmon Fillet",
    2956: "Crispy Golden Fish & Chips",
    2104: "Pan-Seared Lemon Garlic Tilapia",
    2444: "Butter Garlic King Prawns",
    2867: "Crumbed Fried Calamari Rings",
    1445: "Coastal Seafood Fisherman Stew"
}

def ingest_and_generate_operational_data():
    """
    Ingests Kaggle datasets and builds a high-impact, realistic kitchen operations ecosystem.
    Highlights actionable situations: near-expiry milk/paneer, critical stockouts, supplier SLA differences.
    """
    print("Rebuilding Database schema for High-Impact Kitchen Operations...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    meal_info_path = os.path.join("data", "raw", "meal_info.csv")
    center_info_path = os.path.join("data", "raw", "fulfilment_center_info.csv")
    train_path = os.path.join("data", "raw", "train.csv")

    if not os.path.exists(meal_info_path):
        meal_info_path = os.path.join("..", "data", "raw", "meal_info.csv")
        center_info_path = os.path.join("..", "data", "raw", "fulfilment_center_info.csv")
        train_path = os.path.join("..", "data", "raw", "train.csv")

    meal_df = pd.read_csv(meal_info_path)
    train_df = pd.read_csv(train_path)

    # 1. POPULATE 51 MEALS WITH DELICIOUS REALISTIC RESTAURANT NAMES
    print("Loading 51 realistic restaurant dishes...")
    avg_price_map = train_df.groupby('meal_id')['base_price'].mean().to_dict()

    db_meals = []
    for _, row in meal_df.iterrows():
        m_id = int(row['meal_id'])
        cat = str(row['category'])
        cui = str(row['cuisine'])
        price = round(avg_price_map.get(m_id, 280.0), 2)
        dish_name = MEAL_NAME_MAPPING.get(m_id, f"{cui} {cat} Special #{m_id}")
        
        db_meals.append(Meal(
            meal_id=m_id,
            meal_name=dish_name,
            category=cat,
            cuisine=cui,
            base_price=price,
            is_active=True
        ))
    db.add_all(db_meals)
    db.commit()

    # 3. REALISTIC SUPPLIERS WITH CONTRASTING PERFORMANCE & RELIABILITY
    print("Setting up Supplier Partners with Realistic SLA Metrics...")
    suppliers = [
        Supplier(
            supplier_id=1,
            supplier_name="Apex Farm Fresh Produce",
            contact_details="orders@apexfresh.com",
            lead_time_days=2,
            minimum_order_qty=20.0,
            on_time_delivery_pct=96.5,
            quality_score=4.9
        ),
        Supplier(
            supplier_id=2,
            supplier_name="Golden Valley Poultry & Seafood",
            contact_details="dispatch@goldenvalleymeats.com",
            lead_time_days=3,
            minimum_order_qty=25.0,
            on_time_delivery_pct=84.0, # RISK SUPPLIER! Triggers automated buffer warning
            quality_score=4.5
        ),
        Supplier(
            supplier_id=3,
            supplier_name="Pantry Chef Bulk Grains & Staples",
            contact_details="wholesale@pantrychef.com",
            lead_time_days=4,
            minimum_order_qty=50.0,
            on_time_delivery_pct=98.5,
            quality_score=4.8
        ),
        Supplier(
            supplier_id=4,
            supplier_name="Artisanal Dairy Best Co.",
            contact_details="orders@dairybest.com",
            lead_time_days=1,
            minimum_order_qty=15.0,
            on_time_delivery_pct=94.0,
            quality_score=4.9
        ),
    ]
    db.add_all(suppliers)
    db.commit()

    # 2. INGREDIENTS WITH REALISTIC HIGH-CONTRAST STOCK SCENARIOS
    print("Seeding Kitchen Ingredients Master Library...")
    # (id, name, cat, unit, shelf_life, cost, lead, storage, yield_pct, opening_stock, cur_stock, safety)
    # We deliberately create:
    # - CRITICAL STOCK DEFICITS on Chicken, Onions, Flour (Immediate Order Needed!)
    # - EXPIRING SOON on Fresh Milk, Tomatoes, Fish, Paneer (Needs Promo / Spoilage Rescue!)
    # - HEALTHY / OVERSTOCKED on Rice, Sugar, Cooking Oil
    raw_ingredients = [
        # Meat & Seafood (Critical high value, short shelf life)
        ("ING-CHK", "Fresh Boneless Chicken Fillet", "Meat & Poultry", "kg", 4, 6.80, 2, "Chilled", 0.88, 120.0, 18.0, 60.0),   # CRITICAL DEFICIT (18kg on hand vs 60kg safety)
        ("ING-BEEF", "Lean Minced Beef Tenderloin", "Meat & Poultry", "kg", 4, 8.50, 2, "Chilled", 0.90, 80.0, 24.0, 30.0),
        ("ING-FISH", "Fresh White Fish Fillet", "Seafood", "kg", 3, 9.20, 1, "Chilled", 0.85, 45.0, 14.0, 20.0),               # NEAR EXPIRY & DEFICIT
        ("ING-PRAWN", "Cleaned Tiger Prawns", "Seafood", "kg", 3, 14.50, 2, "Chilled", 0.80, 35.0, 8.0, 15.0),
        
        # Dairy (High Perishable - Core Spoilage Rescue Driver)
        ("ING-MILK", "Fresh Whole Farm Milk", "Dairy", "L", 4, 1.40, 1, "Chilled", 1.00, 150.0, 65.0, 25.0),                    # 45L EXPIRING IN 24H!
        ("ING-PANEER", "Fresh Malai Paneer Cubes", "Dairy", "kg", 5, 7.20, 1, "Chilled", 0.98, 70.0, 28.0, 20.0),               # 16kg EXPIRING IN 36H!
        ("ING-CREAM", "Heavy Cooking Dairy Cream", "Dairy", "L", 8, 3.60, 1, "Chilled", 0.99, 50.0, 32.0, 15.0),
        ("ING-MOZZ", "Mozzarella Cheese Blocks", "Dairy", "kg", 18, 8.40, 2, "Chilled", 1.00, 60.0, 12.0, 25.0),               # DEFICIT FOR PIZZAS!
        ("ING-BUTTER", "Unsalted Cooking Butter", "Dairy", "kg", 30, 6.50, 2, "Chilled", 1.00, 40.0, 26.0, 15.0),
        
        # Fresh Produce
        ("ING-ONION", "Yellow Cooking Onions", "Produce", "kg", 21, 1.20, 2, "Dry", 0.84, 200.0, 25.0, 70.0),                   # HIGH DEFICIT!
        ("ING-TOMATO", "Ripe Farm Vine Tomatoes", "Produce", "kg", 5, 2.40, 2, "Chilled", 0.92, 110.0, 48.0, 30.0),            # 22kg EXPIRING IN 48H!
        ("ING-GARLIC", "Peeled Garlic Cloves", "Produce", "kg", 20, 4.00, 2, "Dry", 0.94, 30.0, 18.0, 10.0),
        ("ING-GINGER", "Fresh Ginger Root", "Produce", "kg", 20, 4.50, 2, "Dry", 0.88, 25.0, 14.0, 8.0),
        ("ING-BELLPEPPER", "Tri-Color Crisp Bell Peppers", "Produce", "kg", 7, 3.20, 2, "Chilled", 0.86, 40.0, 15.0, 15.0),
        ("ING-CARROT", "Sweet Farm Carrots", "Produce", "kg", 12, 1.50, 2, "Chilled", 0.82, 50.0, 22.0, 15.0),
        ("ING-POTATO", "Russet Cooking Potatoes", "Produce", "kg", 30, 1.10, 3, "Dry", 0.85, 180.0, 40.0, 60.0),
        
        # Grains & Pantry Staples (Long Shelf Life)
        ("ING-RICE", "Premium Long-Grain Basmati Rice", "Grains & Staples", "kg", 365, 1.80, 4, "Dry", 1.00, 300.0, 180.0, 50.0), # HEALTHY STOCK
        ("ING-FLOUR", "High-Protein Pizza & Bread Flour", "Grains & Staples", "kg", 180, 1.10, 3, "Dry", 1.00, 250.0, 35.0, 80.0),# DEFICIT FOR PIZZA/BREAD
        ("ING-PASTA", "Durum Wheat Penne Pasta", "Grains & Staples", "kg", 365, 1.60, 3, "Dry", 1.00, 120.0, 45.0, 30.0),
        ("ING-NOODLE", "Egg & Wheat Asian Noodles", "Grains & Staples", "kg", 180, 2.10, 3, "Dry", 1.00, 80.0, 35.0, 20.0),
        ("ING-SUGAR", "Granulated Cane Sugar", "Grains & Staples", "kg", 365, 1.30, 4, "Dry", 1.00, 100.0, 75.0, 20.0),           # HEALTHY STOCK
        
        # Oils, Sauces & Spices
        ("ING-OIL", "Refined Sunflower Cooking Oil", "Oils & Condiments", "L", 365, 2.80, 3, "Dry", 1.00, 150.0, 90.0, 35.0),
        ("ING-OLIVEOIL", "Extra Virgin Olive Oil", "Oils & Condiments", "L", 365, 9.50, 3, "Dry", 1.00, 40.0, 18.0, 12.0),
        ("ING-SOYSAUCE", "Premium Dark Soy Sauce", "Oils & Condiments", "L", 180, 3.50, 3, "Dry", 1.00, 30.0, 16.0, 10.0),
        ("ING-CURRYSPICE", "Aromatic Royal Curry Masala", "Spices", "kg", 180, 12.00, 3, "Dry", 1.00, 25.0, 14.0, 8.0),
        ("ING-COFFEE", "Artisan Roasted Coffee Beans", "Beverages", "kg", 180, 16.00, 3, "Dry", 1.00, 30.0, 8.0, 12.0),
        ("ING-TEA", "Assam Gold CTC Black Tea", "Beverages", "kg", 365, 8.50, 3, "Dry", 1.00, 40.0, 25.0, 10.0)
    ]

    db_ingredients = []
    for ing_id, name, cat, unit, shelf_life, cost, lead, storage, y_pct, op_stock, cur_stock, safety in raw_ingredients:
        pref_supp = 1
        if "Meat" in cat or "Seafood" in cat:
            pref_supp = 2
        elif "Dairy" in cat:
            pref_supp = 4
        elif "Grains" in cat or "Oils" in cat or "Spices" in cat or "Beverages" in cat:
            pref_supp = 3

        db_ingredients.append(Ingredient(
            ingredient_id=ing_id,
            ingredient_name=name,
            category=cat,
            base_unit=unit,
            opening_stock=op_stock,
            current_stock=cur_stock,
            reorder_level=round(safety * 1.5, 1),
            safety_stock=safety,
            shelf_life_days=shelf_life,
            unit_cost=cost,
            supplier_lead_time_days=lead,
            storage_type=storage,
            prep_yield_pct=y_pct,
            preferred_supplier_id=pref_supp,
            active_status=True
        ))
    db.add_all(db_ingredients)
    db.commit()

    # 4. SUPPLIER CATALOG MAPPING
    supp_items = []
    for ing in db_ingredients:
        supp_id = ing.preferred_supplier_id or 1
        pack = 25.0 if "Grains" in ing.category else (10.0 if "Dairy" in ing.category or "Meat" in ing.category else 5.0)
        supp_items.append(SupplierIngredient(
            supplier_id=supp_id,
            ingredient_id=ing.ingredient_id,
            unit_cost=ing.unit_cost,
            minimum_order_qty=ing.safety_stock,
            pack_size=pack,
            lead_time_days=ing.supplier_lead_time_days,
            is_preferred=True
        ))
    db.add_all(supp_items)
    db.commit()

    # 5. REALISTIC CULINARY RECIPES & PORTION BOM
    print("Building Bill of Materials (BOM) for 51 dishes...")
    db_recipes = []
    db_bom = []
    recipe_counter = 1

    for m in db_meals:
        rec = Recipe(
            recipe_id=recipe_counter,
            meal_id=m.meal_id,
            recipe_name=f"{m.meal_name} Recipe",
            serving_basis=1,
            prep_time_mins=random.choice([15, 20, 25, 30])
        )
        db_recipes.append(rec)

        cat = m.category.lower()
        items = []

        if "beverage" in cat:
            if "chai" in m.meal_name.lower() or "tea" in m.meal_name.lower():
                items = [("ING-MILK", 0.18, "L"), ("ING-TEA", 0.015, "kg"), ("ING-SUGAR", 0.02, "kg")]
            elif "coffee" in m.meal_name.lower() or "macchiato" in m.meal_name.lower() or "espresso" in m.meal_name.lower():
                items = [("ING-MILK", 0.15, "L"), ("ING-COFFEE", 0.018, "kg"), ("ING-SUGAR", 0.015, "kg")]
            elif "lassi" in m.meal_name.lower() or "smoothie" in m.meal_name.lower():
                items = [("ING-MILK", 0.25, "L"), ("ING-SUGAR", 0.03, "kg"), ("ING-CREAM", 0.03, "L")]
            else:
                items = [("ING-SUGAR", 0.025, "kg"), ("ING-TEA", 0.01, "kg")]
        
        elif "biryani" in cat or "rice bowl" in cat:
            if "chicken" in m.meal_name.lower():
                items = [("ING-RICE", 0.16, "kg"), ("ING-CHK", 0.18, "kg"), ("ING-ONION", 0.07, "kg"), ("ING-TOMATO", 0.05, "kg"), ("ING-OIL", 0.02, "L"), ("ING-CURRYSPICE", 0.01, "kg")]
            elif "paneer" in m.meal_name.lower():
                items = [("ING-RICE", 0.16, "kg"), ("ING-PANEER", 0.15, "kg"), ("ING-ONION", 0.06, "kg"), ("ING-TOMATO", 0.06, "kg"), ("ING-OIL", 0.02, "L"), ("ING-CURRYSPICE", 0.01, "kg")]
            elif "mutton" in m.meal_name.lower() or "beef" in m.meal_name.lower():
                items = [("ING-RICE", 0.16, "kg"), ("ING-BEEF", 0.18, "kg"), ("ING-ONION", 0.08, "kg"), ("ING-TOMATO", 0.06, "kg"), ("ING-OIL", 0.025, "L"), ("ING-CURRYSPICE", 0.012, "kg")]
            else:
                items = [("ING-RICE", 0.16, "kg"), ("ING-POTATO", 0.12, "kg"), ("ING-ONION", 0.06, "kg"), ("ING-OIL", 0.02, "L"), ("ING-CURRYSPICE", 0.008, "kg")]

        elif "pasta" in cat:
            if "chicken" in m.meal_name.lower():
                items = [("ING-PASTA", 0.14, "kg"), ("ING-CHK", 0.12, "kg"), ("ING-TOMATO", 0.08, "kg"), ("ING-GARLIC", 0.01, "kg"), ("ING-OLIVEOIL", 0.015, "L")]
            elif "bolognese" in m.meal_name.lower():
                items = [("ING-PASTA", 0.14, "kg"), ("ING-BEEF", 0.12, "kg"), ("ING-TOMATO", 0.10, "kg"), ("ING-GARLIC", 0.01, "kg"), ("ING-OLIVEOIL", 0.015, "L")]
            else:
                items = [("ING-PASTA", 0.14, "kg"), ("ING-CREAM", 0.06, "L"), ("ING-BUTTER", 0.02, "kg"), ("ING-GARLIC", 0.01, "kg"), ("ING-OLIVEOIL", 0.01, "L")]

        elif "pizza" in cat:
            items = [("ING-FLOUR", 0.20, "kg"), ("ING-MOZZ", 0.12, "kg"), ("ING-TOMATO", 0.08, "kg"), ("ING-BELLPEPPER", 0.04, "kg"), ("ING-OLIVEOIL", 0.015, "L")]
            if "chicken" in m.meal_name.lower() or "pepperoni" in m.meal_name.lower():
                items.append(("ING-CHK", 0.10, "kg"))

        elif "soup" in cat:
            items = [("ING-TOMATO", 0.15, "kg"), ("ING-BELLPEPPER", 0.05, "kg"), ("ING-ONION", 0.04, "kg"), ("ING-CREAM", 0.03, "L"), ("ING-GARLIC", 0.01, "kg")]
            if "chicken" in m.meal_name.lower():
                items.append(("ING-CHK", 0.08, "kg"))

        elif "seafood" in cat or "fish" in cat:
            protein = "ING-FISH" if "fish" in m.meal_name.lower() or "salmon" in m.meal_name.lower() or "tilapia" in m.meal_name.lower() else "ING-PRAWN"
            items = [(protein, 0.20, "kg"), ("ING-GARLIC", 0.015, "kg"), ("ING-GINGER", 0.01, "kg"), ("ING-BUTTER", 0.025, "kg"), ("ING-OLIVEOIL", 0.015, "L")]

        elif "salad" in cat:
            items = [("ING-BELLPEPPER", 0.08, "kg"), ("ING-TOMATO", 0.08, "kg"), ("ING-ONION", 0.03, "kg"), ("ING-OLIVEOIL", 0.02, "L")]
            if "chicken" in m.meal_name.lower():
                items.append(("ING-CHK", 0.10, "kg"))

        elif "desert" in cat:
            items = [("ING-MILK", 0.22, "L"), ("ING-SUGAR", 0.05, "kg"), ("ING-BUTTER", 0.02, "kg")]

        else: # Starters, Sandwich, Snacks
            items = [("ING-FLOUR", 0.10, "kg"), ("ING-POTATO", 0.10, "kg"), ("ING-ONION", 0.04, "kg"), ("ING-OIL", 0.03, "L")]
            if "chicken" in m.meal_name.lower():
                items.append(("ING-CHK", 0.12, "kg"))
            elif "paneer" in m.meal_name.lower():
                items.append(("ING-PANEER", 0.10, "kg"))

        for entry in items:
            db_bom.append(RecipeIngredient(
                recipe_id=recipe_counter,
                ingredient_id=entry[0],
                quantity_per_serving=entry[1],
                unit=entry[2]
            ))

        recipe_counter += 1

    db.add_all(db_recipes)
    db.commit()
    db.add_all(db_bom)
    db.commit()

    # 6. INVENTORY BATCHES - HIGH DRAMA FEFO EXPIRY LOGIC
    # Here we intentionally inject real kitchen urgency:
    # Batch 1 of Milk: 45L expiring tomorrow!
    # Batch 1 of Tomatoes: 22kg expiring in 2 days!
    # Batch 1 of Fish: 10kg expiring tomorrow!
    print("Assigning FEFO Inventory Batches with Urgent Expiry Scenarios...")
    today = date.today()
    batches = []
    b_idx = 1

    for ing in db_ingredients:
        cur = ing.current_stock
        
        # Scenario 1: Milk (Emergency Spoilage Rescue target)
        if ing.ingredient_id == "ING-MILK":
            exp_days = 1 # Expiring in 24 hours!
            qty1 = 45.0
            qty2 = cur - qty1
        # Scenario 2: Tomatoes (Expiring soon)
        elif ing.ingredient_id == "ING-TOMATO":
            exp_days = 2 # Expiring in 48 hours!
            qty1 = 22.0
            qty2 = cur - qty1
        # Scenario 3: Fish (Expiring soon)
        elif ing.ingredient_id == "ING-FISH":
            exp_days = 1
            qty1 = 10.0
            qty2 = cur - qty1
        # Scenario 4: Paneer (Expiring soon)
        elif ing.ingredient_id == "ING-PANEER":
            exp_days = 2
            qty1 = 16.0
            qty2 = cur - qty1
        else:
            exp_days = random.choice([5, 8, 14, 25, 45])
            qty1 = round(cur * 0.6, 1)
            qty2 = round(cur * 0.4, 1)

        # Batch 1 (Near-Expiry or Oldest Batch)
        batches.append(InventoryBatch(
            batch_id=f"BAT-{ing.ingredient_id.replace('ING-', '')}-{b_idx:02d}",
            ingredient_id=ing.ingredient_id,
            supplier_id=ing.preferred_supplier_id or 1,
            received_date=today - timedelta(days=3),
            expiry_date=today + timedelta(days=exp_days),
            received_qty=qty1,
            remaining_qty=qty1,
            unit_cost=ing.unit_cost,
            storage_location=f"{ing.storage_type} Bay {random.randint(1, 4)}"
        ))
        b_idx += 1

        # Batch 2 (Fresher Batch)
        if qty2 > 0:
            batches.append(InventoryBatch(
                batch_id=f"BAT-{ing.ingredient_id.replace('ING-', '')}-{b_idx:02d}",
                ingredient_id=ing.ingredient_id,
                supplier_id=ing.preferred_supplier_id or 1,
                received_date=today - timedelta(days=1),
                expiry_date=today + timedelta(days=exp_days + ing.shelf_life_days),
                received_qty=qty2,
                remaining_qty=qty2,
                unit_cost=ing.unit_cost,
                storage_location=f"{ing.storage_type} Bay {random.randint(1, 4)}"
            ))
            b_idx += 1

    db.add_all(batches)
    db.commit()

    # 7. EXPORT REALISTIC SYNTHETIC OPERATIONAL INVENTORY DATASET
    print("Generating Operational Kitchen Ledger...")
    csv_rows = []
    db_transactions = []
    
    for ing in db_ingredients:
        for d_offset in range(7, 0, -1):
            tx_date = today - timedelta(days=d_offset)
            used = round(random.uniform(4.0, 18.0), 1)
            wasted = round(random.uniform(0.3, 1.8), 1) if random.random() < 0.4 else 0.0
            received = round(random.uniform(20.0, 50.0), 1) if d_offset in [3, 7] else 0.0
            
            csv_rows.append({
                "date": str(tx_date),
                "ingredient": ing.ingredient_name,
                "unit": ing.base_unit,
                "opening_stock": ing.opening_stock,
                "received_qty": received,
                "used_qty": used,
                "wasted_qty": wasted,
                "shelf_life_days": ing.shelf_life_days,
                "supplier_lead_time_days": ing.supplier_lead_time_days,
                "unit_cost": ing.unit_cost
            })

            if received > 0:
                db_transactions.append(InventoryTransaction(
                    ingredient_id=ing.ingredient_id,
                    transaction_date=datetime.combine(tx_date, datetime.min.time()),
                    transaction_type="RECEIVED",
                    quantity=received,
                    unit=ing.base_unit,
                    reference=f"PO-REC-{ing.ingredient_id[:4]}",
                    notes="Verified delivery receipt from supplier"
                ))
            if used > 0:
                db_transactions.append(InventoryTransaction(
                    ingredient_id=ing.ingredient_id,
                    transaction_date=datetime.combine(tx_date, datetime.min.time()),
                    transaction_type="CONSUMED",
                    quantity=used,
                    unit=ing.base_unit,
                    reference="Kitchen Service Prep",
                    notes="Daily prep consumption for lunch & dinner service"
                ))
            if wasted > 0:
                db_transactions.append(InventoryTransaction(
                    ingredient_id=ing.ingredient_id,
                    transaction_date=datetime.combine(tx_date, datetime.min.time()),
                    transaction_type="WASTAGE",
                    quantity=wasted,
                    unit=ing.base_unit,
                    reference="Prep Loss Log",
                    notes="Peel, trim & shrinkage loss during preparation"
                ))

    out_csv = os.path.join("data", "synthetic_operational_inventory.csv")
    if not os.path.exists("data"):
        out_csv = os.path.join("..", "data", "synthetic_operational_inventory.csv")
    pd.DataFrame(csv_rows).to_csv(out_csv, index=False)
    print(f"Operational inventory dataset exported: {out_csv}")

    db.add_all(db_transactions)
    db.commit()

    # 8. PREDICTIVE DEMAND FORECASTS (WITH REALISTIC SALES VOLUME)
    print("Forecasting weekly demand for 51 dishes...")
    recent_center_data = train_df[(train_df['center_id'] == 55) & (train_df['week'] >= 140)]
    meal_avg_orders = recent_center_data.groupby('meal_id')['num_orders'].mean().to_dict()

    db_forecasts = []
    for m in db_meals:
        # Give flagship dishes strong customer demand
        if "biryani" in m.meal_name.lower():
            base_ord = random.randint(340, 520)
        elif "pizza" in m.meal_name.lower() or "pasta" in m.meal_name.lower():
            base_ord = random.randint(220, 380)
        elif "chai" in m.meal_name.lower() or "coffee" in m.meal_name.lower() or "lassi" in m.meal_name.lower():
            base_ord = random.randint(280, 450)
        else:
            base_ord = float(meal_avg_orders.get(m.meal_id, random.randint(90, 240)))

        pred_ord = round(base_ord * random.uniform(1.05, 1.22), 0)
        db_forecasts.append(DemandForecast(
            meal_id=m.meal_id,
            centre_id=55,
            forecast_week=146,
            predicted_orders=pred_ord,
            baseline_orders=base_ord,
            model_version=forecasting_service.metrics["model_name"]
        ))
    db.add_all(db_forecasts)
    db.commit()

    # 9. RUN PROCUREMENT PLANNING ENGINE
    print("Executing MRP Engine with Yield & Deficits...")
    run_procurement_engine(db, forecast_week=146, centre_id=55)

    # 10. HIGH-IMPACT SPOILAGE RESCUE CAMPAIGNS (Milk & Tomato Flash Specials)
    print("Generating High-Margin Spoilage Rescue Campaigns...")
    rescue1 = RescueCampaign(
        ingredient_id="ING-MILK",
        batch_id="BAT-MILK-01",
        expiring_qty=45.0,
        expiry_date=today + timedelta(days=1),
        promoted_meal_id=2631, # Thick Mango Kesar Lassi
        suggested_discount_pct=25.0,
        projected_rescued_qty=42.0,
        status="ACTIVE"
    )
    rescue2 = RescueCampaign(
        ingredient_id="ING-TOMATO",
        batch_id="BAT-TOMATO-01",
        expiring_qty=22.0,
        expiry_date=today + timedelta(days=2),
        promoted_meal_id=1216, # Fiery Chicken Penne Arrabbiata
        suggested_discount_pct=20.0,
        projected_rescued_qty=20.0,
        status="ACTIVE"
    )
    db.add_all([rescue1, rescue2])
    db.commit()


    # 11. SEED HISTORICAL DAILY STOCK LEDGER (Past 14 Days Audit)
    print("Seeding Daily Stock Ledger (Audit trail)...")
    ledger_entries = []
    for day_offset in range(14, -1, -1):
        ledger_date = today - timedelta(days=day_offset)
        for ing in db_ingredients:
            # Realistic day simulation numbers
            op = round(ing.opening_stock * (0.85 + 0.3 * random.random()), 1)
            rec = round(ing.safety_stock * 0.8, 1) if (day_offset % ing.supplier_lead_time_days == 0) else 0.0
            usd = round(op * 0.22, 1)
            wst = round(usd * (0.02 if ing.shelf_life_days > 30 else 0.06), 1)
            cls = max(0.0, round(op + rec - usd - wst, 1))
            val = round(cls * ing.unit_cost, 2)
            
            ledger_entries.append(DailyStockLedger(
                date=ledger_date,
                ingredient_id=ing.ingredient_id,
                ingredient_name=ing.ingredient_name,
                unit=ing.base_unit,
                opening_stock=op,
                received_qty=rec,
                used_qty=usd,
                wasted_qty=wst,
                closing_stock=cls,
                shelf_life_days=ing.shelf_life_days,
                supplier_lead_time_days=ing.supplier_lead_time_days,
                unit_cost=ing.unit_cost,
                total_valuation=val
            ))
    db.add_all(ledger_entries)
    db.commit()

    db.close()
    print("Ingestion, high-impact realistic data generation completed successfully!")
    return {"status": "success", "synthetic_csv": out_csv}

if __name__ == "__main__":
    ingest_and_generate_operational_data()
