from sklearn.model_selection import train_test_split
import numpy as np

from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor


def evaluate_model(
    model: XGBRegressor,
    test_data: list[dict],
) -> dict:

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
        for row in test_data
    ])

    y_actual = np.array([
        row["target_demand"]
        for row in test_data
    ])

    y_predicted = model.predict(X)

    mae = mean_absolute_error(
        y_actual,
        y_predicted,
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_actual,
            y_predicted,
        )
    )

    return {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "testRecords": len(test_data),
    }

def split_training_data(
    training_data: list[dict],
):
    if len(training_data) < 10:
        raise ValueError(
            "At least 10 records are required for train/test split"
        )

    train_data, test_data = train_test_split(
        training_data,
        test_size=0.2,
        random_state=42,
    )

    return train_data, test_data


def train_and_evaluate(
    training_data: list[dict],
) -> dict:

    train_data, test_data = split_training_data(
        training_data
    )

    model = XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        objective="reg:squarederror",
        random_state=42,
    )

    X_train = np.array([
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
        for row in train_data
    ])

    y_train = np.array([
        row["target_demand"]
        for row in train_data
    ])

    model.fit(X_train, y_train)

    evaluation = evaluate_model(
        model,
        test_data,
    )

    return {
        "evaluation": evaluation,
        "trainingRecords": len(train_data),
        "testRecords": len(test_data),
    }