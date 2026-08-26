import os
import numpy as np
from xgboost import XGBRegressor


MODEL_PATH = "models/demand_model.json"


def train_model(training_data: list[dict]) -> XGBRegressor:
    if len(training_data) < 10:
        raise ValueError(
            "At least 10 training records are required"
        )

    X = np.array([
        [
            row["sales_last_7_days"],
            row["sales_last_30_days"],
            row["average_daily_demand_7"],
            row["average_daily_demand_30"],
            row["demand_trend"],
            row["current_stock"],
            row["minimum_stock"],
            row["maximum_stock"],
            row["reorder_point"],
        ]
        for row in training_data
    ])

    y = np.array([
        row["target_demand"]
        for row in training_data
    ])

    model = XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        objective="reg:squarederror",
        random_state=42,
    )

    model.fit(X, y)

    os.makedirs("models", exist_ok=True)

    model.save_model(MODEL_PATH)

    return model


def load_model() -> XGBRegressor:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Trained demand model not found. Train the model first."
        )

    model = XGBRegressor()
    model.load_model(MODEL_PATH)

    return model