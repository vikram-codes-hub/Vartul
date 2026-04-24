"""
model1_engagement.py — Vartul Engagement Score Model

Predicts engagement_score from raw user activity signals.

Features (inputs) — only raw signals, no pre-calculated scores:
    watch_time, watch_percentage, likes, shares, comments,
    save_video, views, replay_count, video_length, is_viral_video

Target (output):
    engagement_score — continuous value (0 to ~162)

Algorithm: Random Forest Regressor
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from utils import load_data, print_section, DATA_PATH

# Features: only raw user activity — no pre-calculated columns
FEATURES = [
    "watch_time",
    "watch_percentage",
    "likes",
    "shares",
    "comments",
    "save_video",
    "views",
    "replay_count",
    "video_length",
    "is_viral_video",
]
TARGET = "engagement_score"


def train(data_path=DATA_PATH, save=True):
    print_section("Model 1: Engagement Score — Training")

    df = load_data(data_path)

    X = df[FEATURES]
    y = df[TARGET]

    print(f"  Rows            : {len(X):,}")
    print(f"  Features        : {FEATURES}")
    print(f"  Target range    : {y.min():.2f} – {y.max():.2f}")
    print(f"  Target mean     : {y.mean():.2f}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n  Train / Test    : {len(X_train):,} / {len(X_test):,}")

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )

    print("  Training...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    print_section("Model 1: Results")
    print(f"  MAE             : {mae:.4f}  (avg prediction error)")
    print(f"  RMSE            : {rmse:.4f}")
    print(f"  R² Score        : {r2:.4f}  (1.0 = perfect)")

    # Feature importance
    importances = pd.Series(model.feature_importances_, index=FEATURES)
    importances = importances.sort_values(ascending=False)
    print("\n  Feature Importances:")
    for feat, imp in importances.items():
        bar = "█" * int(imp * 40)
        print(f"    {feat:<22} {imp:.4f}  {bar}")

    if save:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model1.pkl")
        with open(path, "wb") as f:
            pickle.dump(model, f)
        print(f"\n  Saved → {path}")

    return model


def predict(watch_time, watch_percentage, likes, shares, comments,
            save_video=0, views=0, replay_count=0,
            video_length=60, is_viral_video=0):
    """
    Predict engagement score for one interaction.

    Example:
        score = predict(watch_time=45, watch_percentage=80,
                        likes=12, shares=3, comments=2, views=400)
        print(score)
    """
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model1.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError("model1.pkl not found. Run train() first.")

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    X = pd.DataFrame([{
        "watch_time":       watch_time,
        "watch_percentage": watch_percentage,
        "likes":            likes,
        "shares":           shares,
        "comments":         comments,
        "save_video":       save_video,
        "views":            views,
        "replay_count":     replay_count,
        "video_length":     video_length,
        "is_viral_video":   is_viral_video,
    }])
    return round(float(model.predict(X)[0]), 4)


if __name__ == "__main__":
    train()

    print_section("Model 1: Sample Predictions")
    cases = [
        {"label": "Power viewer  ", "watch_time": 58, "watch_percentage": 92, "likes": 40, "shares": 10, "comments": 8, "views": 800},
        {"label": "Casual viewer ", "watch_time": 15, "watch_percentage": 30, "likes": 2,  "shares": 0,  "comments": 0, "views": 100},
        {"label": "Bot-like      ", "watch_time": 1,  "watch_percentage": 2,  "likes": 90, "shares": 40, "comments": 20,"views": 5000},
    ]
    for c in cases:
        label = c.pop("label")
        score = predict(**c)
        print(f"  {label} → Engagement Score: {score}")
