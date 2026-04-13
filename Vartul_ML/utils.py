"""
utils.py — Vartul Common Utilities
Shared data loading, preprocessing, and helpers for all 3 models.
"""

import os
import sys
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

# ── Dataset path — update this if file is elsewhere ──────────────────────────
DATA_PATH = r"1773666452049_vartul_dataset_syn.xlsx"

# Bot threshold: bot_probability > this value = bot
BOT_THRESHOLD = 0.4


def load_data(path=DATA_PATH):
    """Load and clean the Vartul dataset."""
    df = pd.read_excel(path)
    df.columns = df.columns.str.strip()

    # Fix stake amount column name
    if "stake_amount  TWT" in df.columns:
        df.rename(columns={"stake_amount  TWT": "stake_amount"}, inplace=True)

    # Drop ID and timestamp columns — not useful for ML
    drop_cols = ["interaction_id", "user_id", "creator_id",
                 "video_id", "watch_timestamp"]
    df.drop(columns=[c for c in drop_cols if c in df.columns], inplace=True)

    # Encode categorical columns
    cat_cols = ["video_category", "language", "device_type", "network_type"]
    le = LabelEncoder()
    for col in cat_cols:
        if col in df.columns:
            df[col] = le.fit_transform(df[col].astype(str))

    # Create binary bot label from bot_probability
    df["bot_label"] = (df["bot_probability"] > BOT_THRESHOLD).astype(int)

    return df


def print_section(title):
    print("\n" + "=" * 55)
    print(f"  {title}")
    print("=" * 55)
