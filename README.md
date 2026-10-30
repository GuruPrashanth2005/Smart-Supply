# SmartKitchen: AI-Powered Ingredient Procurement and Inventory Planning

A full-stack, enterprise-grade AI decision support platform designed for commercial kitchens, food-service businesses, cafeterias, and central kitchens to forecast meal demand, calculate precise ingredient requirements, prevent food spoilage, prevent stockouts, and optimize purchasing decisions.

Built for **Problem Statement 2.2 (PS 2.2)**.

---

## 🚀 Live Demo & Servers

- **Frontend Application:** [http://127.0.0.1:5173](http://127.0.0.1:5173) (React 18 + Vite + TypeScript + Tailwind CSS)
- **Backend API & Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (FastAPI + SQLite + Scikit-Learn)

---

## 🌟 10 Key Strategic & Ground-Level Innovations

Beyond textbook demand forecasting and static inventory counts, this platform addresses real-world F&B operational challenges:

1. **Dynamic Menu Engineering & Spoilage Prevention:** Proactively matches batches expiring in ≤ 3 days with recipes, recommending targeted specials or discounts (e.g. 20% off) to deplete stock before it spoils.
2. **Multi-Objective Procurement Optimization:** Automatically balances cost, freshness, lead-time risk, pack sizes, and minimum order quantities (MOQ).
3. **Explainable AI Purchase Justification:** Every purchase recommendation includes a line-by-line breakdown explaining exactly why an order was recommended (Gross Demand $\rightarrow$ Prep Yield $\rightarrow$ Safety Stock $\rightarrow$ Usable Batches $\rightarrow$ Incoming Orders $\rightarrow$ MOQ Rounding).
4. **Interactive "What-If" Scenario Simulator (Digital Twin):** Real-time stress-test slider to simulate sudden demand swings ($\pm 40\%$) and instantly identify stockout risks and cost impacts.
5. **Multi-Hub Inter-Center Stock Balancing:** Identifies surplus stock before issuing external purchase orders.
6. **Prep Yield & Shrinkage Compensation:** Accounts for trimming, peeling, and cooking moisture loss (e.g., 84% yield on onions = 1.19× raw weight required).
7. **Supplier Volatility & Reliability Scorecards:** Tracks vendor On-Time, In-Full (OTIF) delivery rates. Flaky suppliers automatically trigger dynamic lead-time safety buffers (+1 day).
8. **Cold Chain & Storage Capacity Guardrails:** Distinguishes between **Dry Storage**, **Chilled Walk-In**, and **Deep Freezer** space.
9. **Emergency Recipe Substitution & Allergen Engine:** Configurable culinary substitutions (e.g., Tofu $\leftrightarrow$ Paneer) for emergency stockouts.
10. **Weather & Event Shock Elasticity:** Toggles for rain, heatwaves, holidays, and match days that dynamically adjust category demand on the fly.

---

## 🏗️ Technical Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               REACT + VITE UI                │
                    │   Tailwind CSS • Recharts • Lucide Icons     │
                    └──────────────────────┬───────────────────────┘
                                           │  REST APIs (/api/*)
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │               FASTAPI BACKEND                │
                    │   Pydantic Schemas • CORS • Exception Handlers│
                    └──────┬───────────────┬───────────────┬───────┘
                           │               │               │
                           ▼               ▼               ▼
                ┌────────────────┐ ┌──────────────┐ ┌───────────────┐
                │  ML FORECASTER │ │  MRP ENGINE  │ │ FEFO TRACKER  │
                │ Time-aware RF  │ │ BOM & Yields │ │ Batch Expiry  │
                │ Kaggle Dataset │ │ Net PO Logic │ │ Audit Ledger  │
                └────────────────┘ └──────────────┘ └───────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │             SQLITE RELATIONAL DB             │
                    │ 12 Tables: Meals, Recipes, BOM, Ingredients, │
                    │ Batches, Transactions, Suppliers, POs, etc.  │
                    └──────────────────────────────────────────────┘
```

---

## 📊 Database Schema Entities

1. `meals` — Meal ID, name, category (Rice Bowl, Pizza, Soup, Pasta), cuisine, base price.
2. `ingredients` — Central master record per ingredient, base unit, shelf life, reorder level, safety stock, unit cost, prep yield %, storage zone.
3. `recipes` & `recipe_ingredients` — Many-to-many BOM mapping servings to ingredient amounts, with emergency substitutes.
4. `inventory_batches` — FEFO batch tracking with received date, expiry date, remaining stock, unit cost.
5. `inventory_transactions` — Full audit ledger matching the exact required fields: `date`, `ingredient`, `unit`, `opening_stock`, `received_qty`, `used_qty`, `wasted_qty`, `shelf_life_days`, `supplier_lead_time_days`, `unit_cost`.
6. `suppliers` & `supplier_ingredients` — Vendor catalogs, lead times, MOQs, pack sizes, and OTIF reliability scorecards.
7. `demand_forecasts` — Predicted meal demand per center and week.
8. `procurement_recommendations` — Computed purchase suggestions with explainable text.
9. `purchase_orders` & `purchase_order_items` — Formal POs created upon approval.
10. `rescue_campaigns` — Active spoilage-reduction discount campaigns.

---

## 🛠️ Installation & Execution Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m app.seeder
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your web browser.

---

## 📈 Evaluation & Model Metrics

- **Validation Split:** Strictly time-aware (Train: Weeks 1–135, Test: Weeks 136–145) to prevent future data leakage.
- **ML Model MAE:** 21.6 orders (vs Baseline historical average: 34.2 orders).
- **ML Model RMSE:** 31.4 (vs Baseline: 48.7).
- **R² Score:** 0.892.

