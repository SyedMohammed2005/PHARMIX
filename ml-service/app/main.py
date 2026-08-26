from app.model import train_model, load_model
from app.evaluation import train_and_evaluate
from app.metadata import create_model_metadata
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Pharmix ML Service",
    version="1.0.0",
)


class PredictionRequest(BaseModel):
    sales_last_7_days: float
    sales_last_30_days: float
    average_daily_demand_7: float
    average_daily_demand_30: float
    demand_trend: float
    current_stock: float
    minimum_stock: float
    maximum_stock: float
    reorder_point: float


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "Pharmix ML Service",
        "status": "healthy",
    }


@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        model = load_model()

        features = [[
            request.sales_last_7_days,
            request.sales_last_30_days,
            request.average_daily_demand_7,
            request.average_daily_demand_30,
            request.demand_trend,
            request.current_stock,
            request.minimum_stock,
            request.maximum_stock,
            request.reorder_point,
        ]]

        predicted_daily_demand = float(
            model.predict(features)[0]
        )

        predicted_7_day_demand = round(
            predicted_daily_demand * 7,
            2,
        )

        if request.current_stock < predicted_7_day_demand:
            recommendation = "RESTOCK_REQUIRED"
        elif (
            request.current_stock
            <= predicted_7_day_demand * 1.2
        ):
            recommendation = "LOW_STOCK_RISK"
        else:
            recommendation = "SUFFICIENT_STOCK"

        # Calculate target stock using predicted demand
        # and the pharmacy's reorder policy.
        target_stock = min(
            request.maximum_stock,
            max(
                predicted_7_day_demand,
                request.reorder_point,
            ),
        )

        # Calculate how many units should be added
        # to reach the target stock level.
        recommended_restock_quantity = max(
            0,
            target_stock - request.current_stock,
        )

        return {
            "success": True,
            "prediction": {
                "predictedDailyDemand": round(
                    predicted_daily_demand,
                    2,
                ),
                "predicted7DayDemand": predicted_7_day_demand,
                "currentStock": request.current_stock,
                "recommendation": recommendation,
                "recommendedRestockQuantity": round(
                    recommended_restock_quantity,
                    2,
                ),
                "model": {
                    "name": "XGBoost",
                    "version": "1.0.0",
                },
            },
        }

    except FileNotFoundError as error:
        return {
            "success": False,
            "message": str(error),
        }
@app.post("/train")
def train(training_data: list[dict]):

    try:
        model = train_model(training_data)

        metadata = create_model_metadata(
            training_records=len(training_data)
        )

        return {
            "success": True,
            "message": "XGBoost model trained successfully",
            "trainingRecords": len(training_data),
            "metadata": metadata,
        }

    except ValueError as error:
        return {
            "success": False,
            "message": str(error),
        }


@app.post("/evaluate")
def evaluate_model_endpoint(data: dict):
    try:
        training_data = data.get("trainingData", [])

        if not training_data:
            return {
                "success": False,
                "message": "Training data is required",
            }

        result = train_and_evaluate(training_data)

        evaluation = result["evaluation"]

        metadata = create_model_metadata(
            training_records=result["trainingRecords"],
            mae=evaluation["mae"],
            rmse=evaluation["rmse"],
        )

        return {
            "success": True,
            **result,
            "metadata": metadata,
        }

    except Exception as error:
        print("Model evaluation error:", error)

        return {
            "success": False,
            "message": str(error),
        }