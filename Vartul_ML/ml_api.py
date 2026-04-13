from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import pickle
import os

from model1_engagement import predict as eng_predict
from model2_bot_detection import predict as bot_predict
from model3_feed_ranking import predict as feed_predict

app = Flask(__name__)

# ==============================
# PRELOAD MODELS AT STARTUP
# ==============================
_BASE = os.path.dirname(os.path.abspath(__file__))

def _load(path):
    with open(path, "rb") as f:
        return pickle.load(f)

_model1 = _load(os.path.join(_BASE, "model1.pkl"))
_model2 = _load(os.path.join(_BASE, "model2.pkl"))
_model3 = _load(os.path.join(_BASE, "model3.pkl"))

print("✅ All 3 ML models loaded at startup")


# ==============================
# TEXT SCORING FUNCTION (NEW)
# ==============================
def get_text_score(caption):
    if not caption:
        return 0.5  # neutral

    text = caption.lower()
    score = 0.5

    if any(word in text for word in ["ai", "machine learning", "technology"]):
        score += 0.3

    if any(word in text for word in ["stock", "finance", "market"]):
        score += 0.25

    if any(word in text for word in ["football", "sports", "match"]):
        score += 0.2

    if any(word in text for word in ["music", "concert"]):
        score += 0.15

    if "random" in text or "boring" in text:
        score -= 0.2

    # Clamp between 0 and 1
    return max(0, min(score, 1))


@app.route("/")
def home():
    return "ML API Running 🚀"


# ==============================
# MAIN PREDICT API
# ==============================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    # ==========================
    # STEP 1: TEXT SCORE
    # ==========================
    caption = data.get("caption", "")
    text_score = get_text_score(caption)

    # ==========================
    # STEP 2: ENGAGEMENT MODEL
    # ==========================
    eng_score = eng_predict(
        watch_time=data["watch_time"],
        watch_percentage=data["watch_percentage"],
        likes=data["likes"],
        shares=data["shares"],
        comments=data["comments"],
        views=data["views"]
    )

    # ==========================
    # STEP 3: BOT DETECTION
    # ==========================
    bot = bot_predict(
        scroll_speed=data["scroll_speed"],
        skip_time=data["skip_time"],
        watch_percentage=data["watch_percentage"],
        session_duration=data["session_duration"],
        videos_per_session=data["videos_per_session"],
        watch_time=data["watch_time"],
        likes=data["likes"],
        shares=data["shares"],
        comments=data["comments"],
        stake_amount=data["stake_amount"]
    )

    # ==========================
    # STEP 4: FEED RANKING MODEL
    # ==========================
    feed = feed_predict(
        engagement_score=eng_score,
        creator_reputation=data["creator_reputation"],
        creator_followers=data["creator_followers"],
        stake_amount=data["stake_amount"],
        is_viral_video=data.get("is_viral_video", 0),
        watch_percentage=data["watch_percentage"],
        replay_count=data.get("replay_count", 0),
        save_video=data.get("save_video", 0),
        video_category=data.get("video_category", 1),
        follow_creator=data.get("follow_creator", 0),
        viewer_reward=data.get("viewer_reward", 0.5),
        video_length=data.get("video_length", 60),
        views=data["views"]
    )

    # ==========================
    # STEP 5: FINAL SCORE
    # ==========================
    final_score = 0.7 * feed + 0.3 * text_score

    return jsonify({
        "engagement_score": float(eng_score),
        "bot": bot,
        "feed_score": float(final_score)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5001)