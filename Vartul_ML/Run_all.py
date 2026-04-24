"""
run_all.py — Vartul ML Pipeline
Trains all 3 models on the dataset and runs the full pipeline demo.

Usage:
    python Run_all.py

Requirements:
    pip install scikit-learn pandas openpyxl numpy
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import time
from utils import print_section
from model1_engagement    import train as train1, predict as eng_predict
from model2_bot_detection import train as train2, predict as bot_predict
from model3_feed_ranking  import train as train3, predict as feed_predict, distribute_epoch_rewards


def main():
    print("\n" + "█" * 55)
    print("  VARTUL ML PIPELINE — Training All 3 Models")
    print("█" * 55)

    total_start = time.time()

    # Train
    t = time.time()
    train1()
    print(f"\n  Model 1 done in {time.time()-t:.1f}s")

    t = time.time()
    train2()
    print(f"\n  Model 2 done in {time.time()-t:.1f}s")

    t = time.time()
    train3()
    print(f"\n  Model 3 done in {time.time()-t:.1f}s")

    # Full pipeline end-to-end demo
    print_section("Full Pipeline: One Interaction End-to-End")

    interaction = {
        # Raw activity signals (Model 1 inputs)
        "watch_time":         48,
        "watch_percentage":   85.0,
        "likes":              14,
        "shares":             3,
        "comments":           2,
        "save_video":         1,
        "views":              500,
        "replay_count":       1,
        "video_length":       60,
        "is_viral_video":     0,
        # Behavioral session signals (Model 2 inputs)
        "scroll_speed":       1.6,
        "skip_time":          10,
        "session_duration":   800,
        "videos_per_session": 5,
        "stake_amount":       120.0,
        # Creator/content signals (Model 3 inputs)
        "creator_reputation": 0.72,
        "creator_followers":  12000,
        "follow_creator":     0,
        "video_category":     1,
        "viewer_reward":      0.5,
    }

    print("\n  Step 1 — Engagement Score (Model 1)")
    eng_score = eng_predict(
        watch_time=interaction["watch_time"],
        watch_percentage=interaction["watch_percentage"],
        likes=interaction["likes"],
        shares=interaction["shares"],
        comments=interaction["comments"],
        save_video=interaction["save_video"],
        views=interaction["views"],
        replay_count=interaction["replay_count"],
        video_length=interaction["video_length"],
        is_viral_video=interaction["is_viral_video"],
    )
    print(f"  Engagement Score  : {eng_score}")

    print("\n  Step 2 — Bot Detection (Model 2)")
    bot_result = bot_predict(
        scroll_speed=interaction["scroll_speed"],
        skip_time=interaction["skip_time"],
        watch_percentage=interaction["watch_percentage"],
        session_duration=interaction["session_duration"],
        videos_per_session=interaction["videos_per_session"],
        watch_time=interaction["watch_time"],
        likes=interaction["likes"],
        shares=interaction["shares"],
        comments=interaction["comments"],
        stake_amount=interaction["stake_amount"],
    )
    print(f"  Is Bot            : {bot_result['is_bot']}")
    print(f"  Bot Probability   : {bot_result['bot_probability']}")
    print(f"  Trust Score       : {bot_result['trust_score']}/100")
    print(f"  Action            : {bot_result['action']}")

    print("\n  Step 3 — Feed Score (Model 3)")
    feed_score = feed_predict(
        engagement_score=eng_score,
        creator_reputation=interaction["creator_reputation"],
        creator_followers=interaction["creator_followers"],
        stake_amount=interaction["stake_amount"],
        is_viral_video=interaction["is_viral_video"],
        watch_percentage=interaction["watch_percentage"],
        replay_count=interaction["replay_count"],
        save_video=interaction["save_video"],
        video_category=interaction["video_category"],
        follow_creator=interaction["follow_creator"],
        viewer_reward=interaction["viewer_reward"],
        video_length=interaction["video_length"],
        views=interaction["views"],
    )
    print(f"  Feed Score        : {feed_score}")

    # Final reward
    trust_mult   = bot_result["trust_score"] / 100.0
    final_reward = round(eng_score * trust_mult, 4)
    print(f"\n  Final Reward = Engagement ({eng_score}) × Trust ({trust_mult:.2f})")
    print(f"  Final Reward      : {final_reward} TWT tokens")

    # Epoch reward distribution demo
    print_section("Epoch Reward Distribution Demo")
    dist = distribute_epoch_rewards(
        total_pool=10000.0,
        creator_data={"CREATOR_A": 1200.0, "CREATOR_B": 850.0, "CREATOR_C": 320.0},
        viewer_data={"USER_001": 0.82, "USER_002": 0.45, "USER_003": 0.61},
    )
    s = dist["summary"]
    print(f"\n  Total Pool        : {s['total_pool']:,} TWT")
    print(f"  Creators (40%)    : {s['creator_pool']:,.2f} TWT  → {s['creators_rewarded']} creators")
    print(f"  Viewers  (40%)    : {s['viewer_pool']:,.2f} TWT   → {s['viewers_rewarded']} viewers")
    print(f"  Treasury (20%)    : {s['treasury']:,.2f} TWT")

    print("\n  Creator payouts:")
    for cid, amt in sorted(dist["creator_payouts"].items(), key=lambda x: x[1], reverse=True):
        print(f"    {cid}  →  {amt:.4f} TWT")

    print("\n  Viewer payouts:")
    for uid, amt in sorted(dist["viewer_payouts"].items(), key=lambda x: x[1], reverse=True):
        print(f"    {uid}  →  {amt:.4f} TWT")

    print(f"\n" + "█" * 55)
    print(f"  All done in {time.time()-total_start:.1f}s")
    print("█" * 55 + "\n")


if __name__ == "__main__":
    main()
