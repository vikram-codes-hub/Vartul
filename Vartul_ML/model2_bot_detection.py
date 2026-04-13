"""
model2_bot_detection.py — Vartul Bot Detection Model
======================================================
Detects bot sessions using behavioral signals only.

Features (inputs) — only session behavior signals:
    scroll_speed, skip_time, watch_percentage, session_duration,
    videos_per_session, watch_time, likes, shares, comments,
    replay_count, stake_amount, device_type, network_type

Target (output):
    bot_label — binary (0 = real user, 1 = bot)
    derived from: bot_probability > 0.4

Note: bot_probability itself is NOT used as a feature.
      Only raw behavioral signals are used — this is genuine ML.

Algorithms compared:
    - Random Forest Classifier  (primary — best for tabular data)
    - Isolation Forest          (unsupervised anomaly detection)
    - Logistic Regression       (baseline)

Action on detection:
    bot_probability > 0.7  →  slash_stake
    bot_probability > 0.4  →  remove_rewards
    else                   →  allow
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (classification_report, confusion_matrix,
                              roc_auc_score, accuracy_score)

from utils import load_data, print_section, DATA_PATH, BOT_THRESHOLD

# ── Features: raw behavioral signals only — bot_probability NOT included ──────
FEATURES = [
    "scroll_speed",
    "skip_time",
    "watch_percentage",
    "session_duration",
    "videos_per_session",
    "watch_time",
    "likes",
    "shares",
    "comments",
    "replay_count",
    "stake_amount",
    "device_type",
    "network_type",
]
TARGET = "bot_label"


def train(data_path=DATA_PATH, save=True):
    print_section("Model 2: Bot Detection — Training")

    df = load_data(data_path)

    X = df[FEATURES]
    y = df[TARGET]

    bot_count  = int(y.sum())
    real_count = int(len(y) - bot_count)
    print(f"  Rows            : {len(X):,}")
    print(f"  Real users      : {real_count:,}  ({real_count/len(y)*100:.1f}%)")
    print(f"  Bots            : {bot_count:,}  ({bot_count/len(y)*100:.1f}%)")
    print(f"  Bot threshold   : bot_probability > {BOT_THRESHOLD}")
    print(f"  Features        : {FEATURES}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc  = scaler.transform(X_test)

    print_section("Model 2: Algorithm Comparison")

    # ── 1. Random Forest ─────────────────────────────────────────
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]

    # ── 2. Logistic Regression ───────────────────────────────────
    lr = LogisticRegression(class_weight="balanced", max_iter=500, random_state=42)
    lr.fit(X_train_sc, y_train)
    lr_pred = lr.predict(X_test_sc)
    lr_prob = lr.predict_proba(X_test_sc)[:, 1]

    # ── 3. Isolation Forest ──────────────────────────────────────
    iso = IsolationForest(
        n_estimators=100,
        contamination=bot_count / len(y),
        random_state=42,
    )
    iso.fit(X_train)
    iso_pred = np.where(iso.predict(X_test) == -1, 1, 0)

    print(f"\n  {'Algorithm':<25} {'Accuracy':>10}  {'AUC-ROC':>10}")
    print(f"  {'-'*48}")
    for name, pred, prob in [
        ("Random Forest",       rf_pred,  rf_prob),
        ("Logistic Regression", lr_pred,  lr_prob),
        ("Isolation Forest",    iso_pred, iso_pred.astype(float)),
    ]:
        acc = accuracy_score(y_test, pred) * 100
        try:
            auc = roc_auc_score(y_test, prob)
        except Exception:
            auc = 0.0
        print(f"  {name:<25} {acc:>9.2f}%  {auc:>10.4f}")

    # ── Best model: Random Forest ─────────────────────────────────
    print_section("Model 2: Random Forest — Detailed Report")
    print(classification_report(y_test, rf_pred, target_names=["Real user", "Bot"]))

    cm = confusion_matrix(y_test, rf_pred)
    print("  Confusion Matrix:")
    print(f"    True Real  : {cm[0][0]:4d}  |  False Bot  : {cm[0][1]:4d}")
    print(f"    False Real : {cm[1][0]:4d}  |  True Bot   : {cm[1][1]:4d}")

    importances = pd.Series(rf.feature_importances_, index=FEATURES)
    importances = importances.sort_values(ascending=False)
    print("\n  Feature Importances (what gives bots away):")
    for feat, imp in importances.items():
        bar = "█" * int(imp * 50)
        print(f"    {feat:<22} {imp:.4f}  {bar}")

    if save:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model2.pkl")
        with open(path, "wb") as f:
            pickle.dump({"model": rf, "scaler": scaler}, f)
        print(f"\n  Saved → {path}")

    return rf, scaler


def predict(scroll_speed, skip_time, watch_percentage, session_duration,
            videos_per_session, watch_time, likes, shares, comments,
            replay_count=0, stake_amount=0.0, device_type=0, network_type=0):
    """
    Predict whether a session is a bot.

    Returns:
        dict:
            is_bot          : True / False
            bot_probability : 0.0 – 1.0
            trust_score     : 0 – 100
            action          : 'allow' / 'remove_rewards' / 'slash_stake'
    """
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model2.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError("model2.pkl not found. Run train() first.")

    with open(model_path, "rb") as f:
        saved = pickle.load(f)

    model = saved["model"]

    X = pd.DataFrame([{
        "scroll_speed":       scroll_speed,
        "skip_time":          skip_time,
        "watch_percentage":   watch_percentage,
        "session_duration":   session_duration,
        "videos_per_session": videos_per_session,
        "watch_time":         watch_time,
        "likes":              likes,
        "shares":             shares,
        "comments":           comments,
        "replay_count":       replay_count,
        "stake_amount":       stake_amount,
        "device_type":        device_type,
        "network_type":       network_type,
    }])

    is_bot   = bool(model.predict(X)[0])
    bot_prob = float(model.predict_proba(X)[0][1])
    trust    = round((1 - bot_prob) * 100, 2)

    if bot_prob >= 0.7:
        action = "slash_stake"
    elif bot_prob >= 0.4:
        action = "remove_rewards"
    else:
        action = "allow"

    return {
        "is_bot":          is_bot,
        "bot_probability": round(bot_prob, 4),
        "trust_score":     trust,
        "action":          action,
    }


if __name__ == "__main__":
    train()

    print_section("Model 2: Sample Predictions")
    cases = [
        {"label": "Normal user  ", "scroll_speed": 1.5,  "skip_time": 12, "watch_percentage": 80, "session_duration": 900,  "videos_per_session": 5,   "watch_time": 45, "likes": 3,   "shares": 1,  "comments": 1, "stake_amount": 100},
        {"label": "Suspicious   ", "scroll_speed": 11.0, "skip_time": 1,  "watch_percentage": 4,  "session_duration": 30,   "videos_per_session": 90,  "watch_time": 2,  "likes": 40,  "shares": 20, "comments": 10,"stake_amount": 0},
        {"label": "Clear bot    ", "scroll_speed": 20.0, "skip_time": 0,  "watch_percentage": 1,  "session_duration": 5,    "videos_per_session": 300, "watch_time": 1,  "likes": 200, "shares": 80, "comments": 50,"stake_amount": 0},
    ]
    for c in cases:
        label = c.pop("label")
        result = predict(**c)
        print(f"  {label} → Bot: {str(result['is_bot']):<5}  "
              f"Prob: {result['bot_probability']:.4f}  "
              f"Trust: {result['trust_score']:5.1f}  "
              f"Action: {result['action']}")
