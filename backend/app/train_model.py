import os
import time
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .models import DemandForecast, Meal

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

def train_and_persist_models():
    print("=" * 65)
    print("STARTING MULTI-MODEL ML PIPELINE: BASELINE vs GBDT vs XGBOOST")
    print("=" * 65)

    start_time = time.time()
    
    # Paths
    raw_dir = os.path.join("..", "data", "raw")
    if not os.path.exists(raw_dir):
        raw_dir = os.path.join("data", "raw")

    train_path = os.path.join(raw_dir, "train.csv")
    meal_path = os.path.join(raw_dir, "meal_info.csv")
    center_path = os.path.join(raw_dir, "fulfilment_center_info.csv")
    model_save_path = os.path.join("models", "demand_forecast_model.joblib")

    print(f"Loading raw Kaggle datasets...")
    train_df = pd.read_csv(train_path)
    meal_df = pd.read_csv(meal_path)
    center_df = pd.read_csv(center_path)

    # 1. DATA MERGING & FEATURE ENGINEERING
    df = train_df.merge(meal_df, on="meal_id", how="left")
    df = df.merge(center_df, on="center_id", how="left")
    df = df.sort_values(by=["week", "center_id", "meal_id"]).reset_index(drop=True)

    df["discount"] = df["base_price"] - df["checkout_price"]
    df["discount_ratio"] = (df["discount"] / df["base_price"]).fillna(0.0)
    df["promo_interaction"] = df["emailer_for_promotion"] * 2 + df["homepage_featured"] * 3

    cat_cols = ["category", "cuisine", "center_type"]
    for col in cat_cols:
        df[col] = df[col].astype("category").cat.codes

    feature_cols = [
        "checkout_price",
        "base_price",
        "discount",
        "discount_ratio",
        "emailer_for_promotion",
        "homepage_featured",
        "promo_interaction",
        "category",
        "cuisine",
        "center_type",
        "op_area",
        "city_code",
        "region_code",
        "meal_id",
        "center_id"
    ]

    y_raw = df["num_orders"].values
    y_log = np.log1p(y_raw)
    X = df[feature_cols]

    # 2. TIME-BASED TEMPORAL SPLIT (Weeks 1-135 vs Weeks 136-145)
    split_week = 135
    train_mask = df["week"] <= split_week
    test_mask = df["week"] > split_week

    X_train, y_train_log = X[train_mask], y_log[train_mask]
    X_test, y_test_log = X[test_mask], y_log[test_mask]
    y_test_raw = y_raw[test_mask]

    print(f"Dataset split: Train = {len(X_train):,} samples, Test = {len(X_test):,} samples")

    # 3. BASELINE MODEL
    print("\n[1/3] Computing Historical Baseline...")
    train_hist = df[train_mask].groupby(["center_id", "meal_id"])["num_orders"].mean().to_dict()
    global_mean = df[train_mask]["num_orders"].mean()

    baseline_preds = np.array([train_hist.get((r["center_id"], r["meal_id"]), global_mean) for _, r in df[test_mask].iterrows()])
    baseline_mae = mean_absolute_error(y_test_raw, baseline_preds)
    baseline_rmse = np.sqrt(mean_squared_error(y_test_raw, baseline_preds))

    # 4. MODEL 2: HistGradientBoosting
    print("\n[2/3] Training HistGradientBoosting Regressor...")
    gbdt_model = HistGradientBoostingRegressor(max_iter=150, max_depth=10, learning_rate=0.1, random_state=42)
    gbdt_model.fit(X_train, y_train_log)
    gbdt_pred_raw = np.clip(np.expm1(gbdt_model.predict(X_test)), 0, None)
    gbdt_mae = mean_absolute_error(y_test_raw, gbdt_pred_raw)
    gbdt_rmse = np.sqrt(mean_squared_error(y_test_raw, gbdt_pred_raw))
    gbdt_r2 = r2_score(y_test_raw, gbdt_pred_raw)

    # 5. MODEL 3: XGBoost (if installed)
    xgb_metrics = None
    winning_model = gbdt_model
    winning_name = "HistGradientBoosting"

    if XGB_AVAILABLE:
        print("\n[3/3] Training XGBoost (XGBRegressor) on 400k+ rows...")
        xgb_model = xgb.XGBRegressor(
            n_estimators=180,
            max_depth=9,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            tree_method="hist",
            random_state=42,
            n_jobs=-1
        )
        xgb_model.fit(X_train, y_train_log)
        xgb_pred_log = xgb_model.predict(X_test)
        xgb_pred_raw = np.clip(np.expm1(xgb_pred_log), 0, None)

        xgb_mae = mean_absolute_error(y_test_raw, xgb_pred_raw)
        xgb_rmse = np.sqrt(mean_squared_error(y_test_raw, xgb_pred_raw))
        xgb_r2 = r2_score(y_test_raw, xgb_pred_raw)
        xgb_rmsle = np.sqrt(mean_squared_error(y_test_log, xgb_pred_log))

        xgb_metrics = {
            "mae": round(float(xgb_mae), 2),
            "rmse": round(float(xgb_rmse), 2),
            "r2": round(float(xgb_r2), 3),
            "rmsle": round(float(xgb_rmsle), 3)
        }
        
        # Select best model
        if xgb_mae < gbdt_mae:
            winning_model = xgb_model
            winning_name = "XGBoost Regressor (XGBRegressor)"
            # Save standalone JSON format for XGBoost
            xgb_json_path = os.path.join("models", "xgboost_demand_model.json")
            xgb_model.save_model(xgb_json_path)
            print(f"-> Saved native XGBoost model to: {xgb_json_path}")

    # 6. PRINT SIDE-BY-SIDE COMPARISON TABLE
    print("\n" + "=" * 65)
    print("COMPREHENSIVE MODEL COMPARISON (UNSEEN WEEKS 136-145):")
    print("=" * 65)
    print(f"{'Model Architecture':<28} | {'MAE':<9} | {'RMSE':<9} | {'R² Score':<8}")
    print("-" * 65)
    print(f"{'Historical Moving Average':<28} | {baseline_mae:<9.2f} | {baseline_rmse:<9.2f} | {'N/A':<8}")
    print(f"{'HistGradientBoosting (Scikit)':<28} | {gbdt_mae:<9.2f} | {gbdt_rmse:<9.2f} | {gbdt_r2:<8.3f}")
    if xgb_metrics:
        print(f"{'XGBoost (Extreme Gradient Boost)':<28} | {xgb_metrics['mae']:<9.2f} | {xgb_metrics['rmse']:<9.2f} | {xgb_metrics['r2']:<8.3f}")
    print("=" * 65)
    print(f"WINNER: {winning_name}")

    # 7. PERSIST MODEL TO DISK
    comparison_summary = {
        "baseline": {"name": "Historical Moving Average", "mae": round(float(baseline_mae), 2), "rmse": round(float(baseline_rmse), 2)},
        "gbdt": {"name": "HistGradientBoosting", "mae": round(float(gbdt_mae), 2), "rmse": round(float(gbdt_rmse), 2), "r2": round(float(gbdt_r2), 3)},
        "xgboost": xgb_metrics if xgb_metrics else None,
        "winner": winning_name,
        "validation_split": f"Train: W1-W{split_week} ({len(X_train):,}) | Test: W{split_week+1}-W{df['week'].max()} ({len(X_test):,})",
        "last_trained": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

    joblib.dump({
        "model": winning_model,
        "feature_cols": feature_cols,
        "metrics": {
            "baseline_mae": round(float(baseline_mae), 2),
            "baseline_rmse": round(float(baseline_rmse), 2),
            "model_mae": xgb_metrics["mae"] if xgb_metrics else round(float(gbdt_mae), 2),
            "model_rmse": xgb_metrics["rmse"] if xgb_metrics else round(float(gbdt_rmse), 2),
            "model_r2": xgb_metrics["r2"] if xgb_metrics else round(float(gbdt_r2), 3),
            "model_name": winning_name,
            "comparison": comparison_summary,
            "validation_split": f"Train: W1-W{split_week} ({len(X_train):,}) | Test: W{split_week+1}-W{df['week'].max()} ({len(X_test):,})",
            "last_trained": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
    }, model_save_path)

    print(f"\nPersisted {winning_name} to: {model_save_path} ({os.path.getsize(model_save_path):,} bytes)")
    elapsed = time.time() - start_time
    print(f"Total pipeline time: {elapsed:.1f}s")
    print("=" * 65)

if __name__ == "__main__":
    train_and_persist_models()
