import json, joblib, numpy as np, pandas as pd

model = joblib.load("model.joblib")
le    = joblib.load("label_encoder.joblib")

SEVERITY_MAP = {"Normal": "normal", "Suspected": "warning", "Confirmed": "critical"}

def handler(event, context):
    body = json.loads(event.get("body", "{}"))
    readings = body.get("readings", [])  # list of last 10 readings, oldest first

    df = pd.DataFrame(readings)
    df["ph_rolling_mean"]  = df["ph_estimated"].rolling(10, min_periods=1).mean()
    df["ph_rolling_std"]   = df["ph_estimated"].rolling(10, min_periods=2).std().fillna(df["ph_estimated"].std())
    df["ph_rolling_min"]   = df["ph_estimated"].rolling(10, min_periods=1).min()
    df["volt_rolling_std"] = df["voltage_raw"].rolling(10, min_periods=2).std().fillna(df["voltage_raw"].std())

    features = ["ph_estimated", "voltage_raw", "temperature_c",
                "ph_rolling_std", "volt_rolling_std", "ph_rolling_mean", "ph_rolling_min"]
    latest = df[features].iloc[[-1]]

    pred_idx = model.predict(latest)[0]
    proba    = model.predict_proba(latest)[0]
    label    = le.inverse_transform([pred_idx])[0]

    return {
        "statusCode": 200,
        "body": json.dumps({
            "severity":         SEVERITY_MAP[label],
            "prediction_label": label,
            "confidence":       round(float(proba.max()), 4),
            "description":      f"Classified as {label} ({proba.max()*100:.1f}% confidence)"
        })
    }
