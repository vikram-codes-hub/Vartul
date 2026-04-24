"""
model3_feed_ranking.py — Vartul Feed Ranking + Reward Distribution
Predicts recommendation_score to rank content in the feed.
Also handles epoch-end reward pool distribution.

Features (inputs) — engagement + creator + content signals:
    engagement_score, creator_reputation, creator_followers,
    stake_amount, is_viral_video, watch_percentage, replay_count,
    save_video, video_category, follow_creator, viewer_reward,
    video_length, views

Note: bot_probability NOT used as feature (it's a separate model output).
      recommendation_score is the target — not an input.

Target (output):
    recommendation_score — continuous (0.27 to 1.0)

Algorithm: Gradient Boosting Regressor

Reward Pool Distribution (per epoch):
    40% → Creators  (by engagement share)
    40% → Viewers   (by contribution share)
    20% → Treasury
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from utils import load_data, print_section, DATA_PATH

# Features — no recommendation_score, no bot_probability
FEATURES = [
    "engagement_score",
    "creator_reputation",
    "creator_followers",
    "stake_amount",
    "is_viral_video",
    "watch_percentage",
    "replay_count",
    "save_video",
    "video_category",
    "follow_creator",
    "viewer_reward",
    "video_length",
    "views",
]
TARGET = "recommendation_score"

REWARD_SPLIT = {"creators": 0.40, "viewers": 0.40, "treasury": 0.20}


def train(data_path=DATA_PATH, save=True):
    print_section("Model 3: Feed Ranking — Training")

    df = load_data(data_path)

    X = df[FEATURES]
    y = df[TARGET]

    print(f"  Rows            : {len(X):,}")
    print(f"  Features        : {len(FEATURES)}")
    print(f"  Target range    : {y.min():.4f} – {y.max():.4f}")
    print(f"  Target mean     : {y.mean():.4f}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n  Train / Test    : {len(X_train):,} / {len(X_test):,}")

    model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        min_samples_leaf=10,
        random_state=42,
    )

    print("  Training...")
    model.fit(X_train, y_train)

    y_pred = np.clip(model.predict(X_test), 0, 1)
    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    print_section("Model 3: Results")
    print(f"  MAE             : {mae:.4f}")
    print(f"  RMSE            : {rmse:.4f}")
    print(f"  R² Score        : {r2:.4f}  (1.0 = perfect)")

    importances = pd.Series(model.feature_importances_, index=FEATURES)
    importances = importances.sort_values(ascending=False)
    print("\n  Feature Importances (what drives feed ranking):")
    for feat, imp in importances.items():
        bar = "█" * int(imp * 50)
        print(f"    {feat:<25} {imp:.4f}  {bar}")

    if save:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model3.pkl")
        with open(path, "wb") as f:
            pickle.dump(model, f)
        print(f"\n  Saved → {path}")

    return model


def predict(engagement_score, creator_reputation, creator_followers,
            stake_amount, is_viral_video=0, watch_percentage=50.0,
            replay_count=0, save_video=0, video_category=0,
            follow_creator=0, viewer_reward=0.0,
            video_length=60, views=0):
    """
    Predict feed/recommendation score for one piece of content.
    Returns score 0.0 – 1.0. Higher = shown earlier in feed.
    """
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model3.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError("model3.pkl not found. Run train() first.")

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    X = pd.DataFrame([{
        "engagement_score":   engagement_score,
        "creator_reputation": creator_reputation,
        "creator_followers":  creator_followers,
        "stake_amount":       stake_amount,
        "is_viral_video":     is_viral_video,
        "watch_percentage":   watch_percentage,
        "replay_count":       replay_count,
        "save_video":         save_video,
        "video_category":     video_category,
        "follow_creator":     follow_creator,
        "viewer_reward":      viewer_reward,
        "video_length":       video_length,
        "views":              views,
    }])

    score = float(model.predict(X)[0])
    return round(np.clip(score, 0, 1), 4)


def distribute_epoch_rewards(total_pool, creator_data, viewer_data):
    """
    Distribute epoch reward pool.

    Args:
        total_pool   : Total TWT tokens this epoch
        creator_data : {creator_id: total_engagement_score}
        viewer_data  : {user_id: contribution_score}

    Returns:
        dict with creator_payouts, viewer_payouts, treasury, summary
    """
    s = REWARD_SPLIT
    creator_pool = total_pool * s["creators"]
    viewer_pool  = total_pool * s["viewers"]
    treasury     = total_pool * s["treasury"]

    creator_payouts = {}
    total_eng = sum(creator_data.values())
    if total_eng > 0:
        for cid, eng in creator_data.items():
            creator_payouts[cid] = round((eng / total_eng) * creator_pool, 4)

    viewer_payouts = {}
    total_contrib = sum(viewer_data.values())
    if total_contrib > 0:
        for uid, contrib in viewer_data.items():
            viewer_payouts[uid] = round((contrib / total_contrib) * viewer_pool, 4)

    return {
        "creator_payouts": creator_payouts,
        "viewer_payouts":  viewer_payouts,
        "treasury":        round(treasury, 4),
        "summary": {
            "total_pool":        total_pool,
            "creator_pool":      round(creator_pool, 2),
            "viewer_pool":       round(viewer_pool, 2),
            "treasury":          round(treasury, 2),
            "creators_rewarded": len(creator_payouts),
            "viewers_rewarded":  len(viewer_payouts),
        },
    }


if __name__ == "__main__":
    train()

    print_section("Model 3: Sample Feed Score Predictions")
    cases = [
        {"label": "Viral content  ", "engagement_score": 140, "creator_reputation": 0.95, "creator_followers": 50000, "stake_amount": 200, "is_viral_video": 1, "watch_percentage": 90, "views": 10000},
        {"label": "Average content", "engagement_score": 65,  "creator_reputation": 0.60, "creator_followers": 5000,  "stake_amount": 50,  "is_viral_video": 0, "watch_percentage": 55, "views": 800},
        {"label": "Low quality    ", "engagement_score": 10,  "creator_reputation": 0.20, "creator_followers": 200,   "stake_amount": 5,   "is_viral_video": 0, "watch_percentage": 20, "views": 50},
    ]
    for c in cases:
        label = c.pop("label")
        score = predict(**c)
        print(f"  {label} → Feed Score: {score:.4f}")

    print_section("Epoch Reward Distribution Demo")
    dist = distribute_epoch_rewards(
        total_pool=10000.0,
        creator_data={"C001": 1200.0, "C002": 850.0, "C003": 320.0},
        viewer_data={"U001": 0.82, "U002": 0.45, "U003": 0.61},
    )
    s = dist["summary"]
    print(f"  Total Pool    : {s['total_pool']:,} TWT")
    print(f"  Creator 40%   : {s['creator_pool']:,.2f} TWT")
    print(f"  Viewer  40%   : {s['viewer_pool']:,.2f} TWT")
    print(f"  Treasury 20%  : {s['treasury']:,.2f} TWT")
    print("\n  Creator payouts:")
    for cid, amt in dist["creator_payouts"].items():
        print(f"    {cid}  →  {amt:.4f} TWT")
    print("\n  Viewer payouts:")
    for uid, amt in dist["viewer_payouts"].items():
        print(f"    {uid}  →  {amt:.4f} TWT")
