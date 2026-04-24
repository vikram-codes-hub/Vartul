"""
demo_bot_behavior.py — Vartul Standalone Bot Detection Demo

Run this script to demonstrate the ML bot detection system
without needing the backend or frontend running.
Calls model2.pkl directly.

Usage:
  cd Vartul_ML
  python demo_bot_behavior.py

Requirements:
  pip install scikit-learn pandas numpy
  (model2.pkl must exist — run: python Run_all.py if not)
"""

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from model1_engagement import predict as eng_predict
from model2_bot_detection import predict as bot_predict
from model3_feed_ranking import predict as feed_predict

# ANSI terminal colors
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

DIVIDER  = CYAN  + "─" * 65 + RESET
DIVIDER2 = CYAN  + "═" * 65 + RESET


def print_header():
    print(f"\n{DIVIDER2}")
    print(f"  {BOLD}{CYAN}🤖  VARTUL ML BOT DETECTION — LIVE DEMO{RESET}")
    print(f"{DIVIDER2}")
    print(f"  {DIM}Running directly against model2.pkl (RandomForestClassifier){RESET}")
    print(f"  {DIM}No backend or frontend needed.{RESET}\n")
    print(f"  {BOLD}Thresholds:{RESET}")
    print(f"    bot_prob  < 0.40  →  {GREEN}✅ ALLOW       (rewards paid normally){RESET}")
    print(f"    bot_prob  ≥ 0.40  →  {YELLOW}⚠️  REMOVE REWARDS (TWT earnings halted){RESET}")
    print(f"    bot_prob  ≥ 0.70  →  {RED}🚨 SLASH STAKE   (staking suspended){RESET}")
    print(f"\n  {BOLD}Key bot signals the model watches:{RESET}")
    print(f"    scroll_speed > 10   (humans = 1–3,  bots = 10–30+)")
    print(f"    videos/session > 50 (humans = 3–10, bots = 80–300)")
    print(f"    watch_time = 1s     (humans = 30–60s)")
    print(f"    skip_time = 0       (bots never wait)")
    print(f"    stake_amount = 0    (bots never stake TWT)")
    print(f"\n  {BOLD}Final reward formula:{RESET}")
    print(f"    {CYAN}TWT = engagement_score × (trust_score / 100){RESET}")
    print(f"{DIVIDER2}\n")


def run_full_pipeline(label, session, creator_reputation=0.7,
                      creator_followers=5000, note=None):
    """Run a session through all 3 ML models and print full output."""
    print(f"{DIVIDER}")
    print(f"  {BOLD}SCENARIO: {label}{RESET}")
    if note:
        print(f"\n  {YELLOW}{note}{RESET}")
    print(f"  {DIM}scroll_speed={session['scroll_speed']}, "
          f"watch%={session['watch_percentage']}%, "
          f"videos/session={session['videos_per_session']}, "
          f"likes={session['likes']}{RESET}")
    print()

    # Step 1: Engagement score
    eng_score = eng_predict(
        watch_time=session["watch_time"],
        watch_percentage=session["watch_percentage"],
        likes=session["likes"],
        shares=session["shares"],
        comments=session["comments"],
        views=session.get("views", 500),
        replay_count=session.get("replay_count", 0),
        save_video=session.get("save_video", 0),
        video_length=session.get("video_length", 60),
        is_viral_video=session.get("is_viral_video", 0),
    )
    print(f"  {BLUE}[Model 1 — Engagement Scorer]{RESET}")
    print(f"    Engagement Score : {BOLD}{eng_score:.4f}{RESET}  (0–162 scale)")

    # Step 2: Bot detection
    bot = bot_predict(
        scroll_speed=session["scroll_speed"],
        skip_time=session["skip_time"],
        watch_percentage=session["watch_percentage"],
        session_duration=session["session_duration"],
        videos_per_session=session["videos_per_session"],
        watch_time=session["watch_time"],
        likes=session["likes"],
        shares=session["shares"],
        comments=session["comments"],
        stake_amount=session.get("stake_amount", 0),
    )

    if bot["action"] == "slash_stake":
        color, icon = RED, "🚨"
    elif bot["action"] == "remove_rewards":
        color, icon = YELLOW, "⚠️ "
    else:
        color, icon = GREEN, "✅"

    print(f"\n  {BLUE}[Model 2 — Bot Detector]{RESET}")
    print(f"    {icon}  Is Bot          : {color}{BOLD}{bot['is_bot']}{RESET}")
    print(f"    {icon}  Bot Probability : {color}{BOLD}{bot['bot_probability']:.4f}{RESET}")
    print(f"         Trust Score     : {BOLD}{bot['trust_score']:.1f}/100{RESET}")
    print(f"         Action          : {color}{BOLD}{bot['action'].upper()}{RESET}")

    # Step 3: Feed ranking
    feed_score = feed_predict(
        engagement_score=eng_score,
        creator_reputation=creator_reputation,
        creator_followers=creator_followers,
        stake_amount=session.get("stake_amount", 0),
        watch_percentage=session["watch_percentage"],
        views=session.get("views", 500),
    )

    print(f"\n  {BLUE}[Model 3 — Feed Ranker]{RESET}")
    print(f"    Recommendation   : {BOLD}{feed_score:.4f}{RESET}  (0.0–1.0, higher = shown first)")

    # Final reward calculation
    trust_mult   = bot["trust_score"] / 100.0
    final_reward = round(eng_score * trust_mult, 4)

    print(f"\n  {BOLD}🏆  Final TWT Reward:{RESET}")
    print(f"    {eng_score:.2f} (engagement) × {trust_mult:.2f} (trust mult) = "
          f"{color}{BOLD}{final_reward} TWT{RESET}")

    if bot["action"] == "allow":
        print(f"\n    {GREEN}→ MongoDB: virtualTwtBalance += {final_reward}{RESET}")
    elif bot["action"] == "remove_rewards":
        print(f"\n    {YELLOW}→ MongoDB: rewards SKIPPED. Warning toast shown on UI.{RESET}")
    else:
        print(f"\n    {RED}→ MongoDB: stake ZEROED. Account flagged. isVerified = false.{RESET}")

    time.sleep(0.5)


SCENARIOS = [
    {
        "label": "1️⃣  NORMAL HUMAN USER",
        "session": {
            "watch_time":         45,
            "watch_percentage":   78,
            "scroll_speed":       1.2,
            "skip_time":          4,
            "session_duration":   420,
            "videos_per_session": 5,
            "likes":              1,
            "shares":             0,
            "comments":           1,
            "stake_amount":       120.0,
            "views":              500,
            "replay_count":       1,
        },
        "creator_reputation": 0.75,
        "creator_followers":  12000,
    },
    {
        "label": "2️⃣  SLIGHTLY SUSPICIOUS (borderline)",
        "session": {
            "watch_time":         3,
            "watch_percentage":   95,
            "scroll_speed":       5.5,
            "skip_time":          0,
            "session_duration":   90,
            "videos_per_session": 25,
            "likes":              0,
            "shares":             0,
            "comments":           0,
            "stake_amount":       10.0,
            "views":              200,
        },
        "creator_reputation": 0.5,
        "creator_followers":  3000,
    },
    {
        "label": "3️⃣  CLEAR BOT — Auto Reward Farmer",
        "session": {
            "watch_time":         1,
            "watch_percentage":   100,
            "scroll_speed":       18.0,
            "skip_time":          0,
            "session_duration":   30,
            "videos_per_session": 80,
            "likes":              0,
            "shares":             0,
            "comments":           0,
            "stake_amount":       0,
            "views":              5000,
        },
        "creator_reputation": 0.3,
        "creator_followers":  500,
    },
    {
        "label": "4️⃣  EXTREME BOT — High-Speed Scraper (no fake likes)",
        "session": {
            "watch_time":         1,
            "watch_percentage":   100,
            "scroll_speed":       30.0,
            "skip_time":          0,
            "session_duration":   10,
            "videos_per_session": 200,
            "likes":              0,
            "shares":             0,
            "comments":           0,
            "stake_amount":       0,
            "views":              10000,
        },
        "creator_reputation": 0.1,
        "creator_followers":  100,
    },
    {
        "label": "5️⃣  LIKE-BOMBING BOT — Fake engagement to fool model",
        "note": ("⚠️  This bot uses likes=50, shares=30, comments=20 deliberately.\n"
                 "  The model was trained where bots = 0 engagement.\n"
                 "  Fake engagement bombing CONFUSES the Random Forest.\n"
                 "  This is a known model weakness."),
        "session": {
            "watch_time":         1,
            "watch_percentage":   100,
            "scroll_speed":       30.0,
            "skip_time":          0,
            "session_duration":   10,
            "videos_per_session": 200,
            "likes":              50,
            "shares":             30,
            "comments":           20,
            "stake_amount":       0,
            "views":              10000,
        },
        "creator_reputation": 0.1,
        "creator_followers":  100,
    },
]


def main():
    print_header()

    for scenario in SCENARIOS:
        run_full_pipeline(
            label=scenario["label"],
            session=scenario["session"],
            creator_reputation=scenario.get("creator_reputation", 0.7),
            creator_followers=scenario.get("creator_followers", 5000),
            note=scenario.get("note", None),
        )

    print(f"\n{DIVIDER2}")
    print(f"  {BOLD}{GREEN}✅  Demo Complete!{RESET}")
    print(f"{DIVIDER2}")
    print(f"\n  {BOLD}Key Takeaways:{RESET}")
    print(f"  1. {BOLD}Bot signals:{RESET} scroll_speed>10, videos/session>50,")
    print(f"     watch_time=1s, skip_time=0, stake_amount=0  → high bot_probability")
    print(f"  2. {BOLD}Like-bombing:{RESET} A bot with likes=50 confuses the")
    print(f"     RandomForest because training data had bots with 0 engagement.")
    print(f"  3. {BOLD}Reward formula:{RESET} TWT = engagement × (trust_score / 100)")
    print(f"     Even a 0.40 bot prob cuts rewards by ~58%.")
    print(f"  4. {BOLD}Defense against like-bombing:{RESET} Rate-limit likes/min")
    print(f"     and add likes_per_minute as a feature in the next model update.\n")


if __name__ == "__main__":
    main()
