"""
bot_detection_demo.py — Vartul Bot Detection Demo
===================================================
Run this script to demonstrate the ML bot detection system.

Usage:
  python bot_detection_demo.py

You need:
  1. Backend running  → nodemon server.js  (port 5000)
  2. ML API running   → python ml_api.py   (port 5001)
  3. A valid JWT token from the running app (see instructions below)

HOW TO GET YOUR TOKEN:
  1. Open the Vartul app in browser (localhost:5173)
  2. Open DevTools → Application → Local Storage → localhost:5173
  3. Copy the value of the key named 'token' (or check cookies)
  -- OR --
  Open DevTools Console and run:
    localStorage.getItem('token')
  Paste the result into TOKEN below.
"""

import requests
import time
import json

# ── CONFIG ────────────────────────────────────────────────────────────────────
API_BASE  = "http://localhost:5000"
TOKEN     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWRjZTExNzQ3ZDJlMTAyOGY5MjcwODkiLCJpYXQiOjE3NzYwODMyMjN9.IfofRcVEblmR2a_XyiSji4nfTInPjzpGhoa7zO33lWo'

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type":  "application/json",
}

# A real video ID from your app (any reel _id from the DB)
VIDEO_ID = "69b933d756fc03a308ce9429"      # ← paste any reel _id here

# ── ANSI colors ───────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


def send_heartbeat(label, signals):
    """Send one heartbeat and print the result."""
    payload = {"videoId": VIDEO_ID, **signals}
    try:
        r = requests.post(f"{API_BASE}/api/engagement/heartbeat",
                          json=payload, headers=HEADERS, timeout=10)
        data = r.json()
    except Exception as e:
        print(f"  {RED}ERROR: {e}{RESET}")
        return

    prob   = data.get("botProbability", "N/A")
    trust  = data.get("trustScore",     "N/A")
    action = data.get("botAction",      "allow")
    warn   = data.get("botWarning",     False)
    earned = data.get("earned",         0)

    # Color the action
    if action == "slash_stake":
        color = RED
        icon  = "🚨"
    elif action == "remove_rewards":
        color = YELLOW
        icon  = "⚠️ "
    else:
        color = GREEN
        icon  = "✅"

    print(f"\n  {BOLD}{label}{RESET}")
    print(f"  {icon}  Bot Probability : {color}{prob}{RESET}")
    print(f"      Trust Score     : {trust}/100")
    print(f"      Action          : {color}{action.upper()}{RESET}")
    print(f"      Earned TWT      : {earned}")
    if warn:
        print(f"      {color}⚡ Bot warning triggered on the UI!{RESET}")
    else:
        print(f"      {GREEN}✓ No warning — user rewarded normally{RESET}")


# ── DEMO SCENARIOS ────────────────────────────────────────────────────────────
SCENARIOS = [
    {
        "label": "1️⃣  Normal Human User",
        "signals": {
            "watchTimeMs":      5000,
            "watchPercentage":  78,
            "scrollSpeed":      1.2,    # slow, natural scroll
            "skipTime":         4,      # started watching after 4s
            "sessionDuration":  420,    # 7 minutes in app
            "videosPerSession": 5,      # 5 videos watched
            "likes":            1,      # liked one video
            "shares":           0,
            "comments":         1,
        },
    },
    {
        "label": "2️⃣  Slightly Suspicious (borderline)",
        "signals": {
            "watchTimeMs":      5000,
            "watchPercentage":  95,     # very high — never pauses
            "scrollSpeed":      4.5,    # faster than normal
            "skipTime":         0,
            "sessionDuration":  120,
            "videosPerSession": 20,     # many videos quickly
            "likes":            0,
            "shares":           0,
            "comments":         0,
        },
    },
    {
        "label": "3️⃣  Clear Bot — Auto Reward Farmer",
        "signals": {
            "watchTimeMs":      5000,
            "watchPercentage":  100,    # always perfect 100%
            "scrollSpeed":      18.0,   # inhuman scroll speed
            "skipTime":         0,      # always starts from 0
            "sessionDuration":  30,     # only 30s but 80 videos
            "videosPerSession": 80,
            "likes":            0,      # bots don't interact
            "shares":           0,
            "comments":         0,
        },
    },
    {
        "label": "4️⃣  Extreme Bot — High-Speed Scraper",
        "signals": {
            "watchTimeMs":      5000,
            "watchPercentage":  100,
            "scrollSpeed":      30.0,   # programmatic
            "skipTime":         0,
            "sessionDuration":  10,
            "videosPerSession": 200,
            "likes":            50,     # fake like bombing
            "shares":           30,
            "comments":         20,
        },
    },
]


def main():
    print(f"\n{BOLD}{CYAN}{'='*60}")
    print("  🤖  VARTUL BOT DETECTION DEMO")
    print(f"{'='*60}{RESET}")
    print(f"  API  → {API_BASE}")
    print(f"  ML   → http://localhost:5001")
    print(f"\n  {YELLOW}Thresholds:{RESET}")
    print(f"    prob < 0.60  → ✅ Allow (rewards paid)")
    print(f"    prob ≥ 0.60  → ⚠️  Remove rewards (toast warning)")
    print(f"    prob ≥ 0.80  → 🚨 Slash stake (stake suspended)")

    if TOKEN == "PASTE_YOUR_JWT_TOKEN_HERE":
        print(f"\n  {RED}{BOLD}⛔  Set your TOKEN and VIDEO_ID at the top of this file first!{RESET}")
        return

    for scenario in SCENARIOS:
        print(f"\n{CYAN}{'─'*60}{RESET}")
        print(f"  Signals: scrollSpeed={scenario['signals']['scrollSpeed']}, "
              f"videosPerSession={scenario['signals']['videosPerSession']}, "
              f"watchPercentage={scenario['signals']['watchPercentage']}%")
        send_heartbeat(scenario["label"], scenario["signals"])
        time.sleep(1)   # small delay between requests

    print(f"\n{CYAN}{'='*60}{RESET}")
    print(f"  {BOLD}Demo complete!{RESET}")
    print(f"  Open the Vartul app in a browser alongside this script")
    print(f"  to see the toast warnings appear in real time.\n")


if __name__ == "__main__":
    main()
