from datetime import datetime, timezone


MODEL_NAME = "XGBoost"
MODEL_VERSION = "1.0.0"


def create_model_metadata(
    training_records: int,
    mae: float | None = None,
    rmse: float | None = None,
) -> dict:
    return {
        "model": MODEL_NAME,
        "version": MODEL_VERSION,
        "trainedAt": datetime.now(
            timezone.utc
        ).isoformat(),
        "trainingRecords": training_records,
        "evaluation": {
            "mae": mae,
            "rmse": rmse,
        },
    }