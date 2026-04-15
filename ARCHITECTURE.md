# VarTul Platform — Definitive Architecture Document
**Complete file-by-file technical breakdown: MERN + ML + Solana Web3**

---

## 📂 Project File Structure

```
VarTul/
├── Frontend/                   # React 19 + Vite SPA
│   └── src/
│       ├── App.jsx             # Root router & layout orchestrator
│       ├── main.jsx            # React entry point, WalletProvider wrapping
│       ├── Pages/              # Full page components
│       │   ├── Home.jsx        # Main social feed
│       │   ├── Reels.jsx       # Short-form video (Watch-to-Earn source)
│       │   ├── Chat.jsx        # Real-time messaging UI
│       │   ├── About.jsx       # Project about page
│       │   ├── Twt_Token.jsx   # TWT token overview page
│       │   └── dashboard/      # Web3 creator dashboard
│       │       ├── Overview.jsx
│       │       ├── WalletPage.jsx     # Airdrop & claim UI
│       │       ├── StakingPage.jsx    # Stake TWT UI
│       │       ├── RewardsPage.jsx
│       │       └── TransactionsPage.jsx
│       ├── Components/         # Reusable UI components
│       ├── Context/            # React Context (auth, socket)
│       ├── Utils/
│       │   ├── axiosInstance.js     # Axios with JWT headers
│       │   └── SocketContext.jsx    # WebSocket management
│       └── store/              # Redux global state
│
├── Backend/                    # Node.js + Express API
│   ├── Server.js               # Entry point: Express + Socket.io + Redis setup
│   ├── Controllers/
│   │   ├── EngagementController.js  # Core TWT/staking logic (948 lines)
│   │   ├── Reelcontroller.js        # Reel CRUD + view tracking
│   │   ├── Usercontroller.js        # Auth, profile, wallet linking
│   │   ├── Messagecontroller.js     # Chat message handling
│   │   └── GovernanceController.js  # DAO voting logic
│   ├── Blockchain/
│   │   ├── TokenService.js     # SPL token transfers via @solana/web3.js
│   │   └── EngagementContract.js  # Anchor contract interaction wrapper
│   ├── Models/                 # Mongoose Schemas
│   │   ├── User.js             # User + wallet + TWT balance schema
│   │   ├── Engagement_Model.js # Staking state schema
│   │   ├── TransactionLog.js   # All TWT tx history
│   │   ├── Reel_Model.js
│   │   └── ... (14 total schemas)
│   ├── routes/
│   │   ├── EngagementRoute.js  # /api/engagement/*
│   │   ├── MlRoute.js          # /api/ml/*  (Node→Python bridge)
│   │   └── ... (8 total route files)
│   └── Config/
│       ├── db.js               # MongoDB connection
│       └── redis.js            # Redis client
│
├── Vartul_ML/                  # Python Flask ML Microservice
│   ├── ml_api.py               # Flask server on port 5001 (ALL endpoints)
│   ├── Run_all.py              # Training pipeline runner
│   ├── model1_engagement.py    # Random Forest Regressor training
│   ├── model2_bot_detection.py # Random Forest + Isolation Forest + LR
│   ├── model3_feed_ranking.py  # Gradient Boosting Regressor
│   ├── utils.py                # load_data(), BOT_THRESHOLD, DATA_PATH
│   ├── model1.pkl              # 9.9 MB - trained engagement model
│   ├── model2.pkl              # 287 KB - trained bot detection model
│   ├── model3.pkl              # 581 KB - trained feed ranking model
│   └── 1773666452049_vartul_dataset_syn.xlsx  # 2.2 MB training dataset
│
└── SmartContracts/
    └── vartul_engagement/
        └── src/lib.rs          # Anchor/Rust smart contract (310 lines)
```

---

## 🌐 Layer 1: The MERN Web2 Stack

### `Backend/Server.js` — The Traffic Cop

This is the Node.js entry point. It wires everything together:

```
Express App
  │
  ├── cors({ origin: "http://localhost:5173" })     ← React frontend only
  ├── await connectDb()                             ← MongoDB connection
  ├── await redisClient.connect()                  ← Redis cache
  ├── Socket.io server on same HTTP port           ← Real-time WS
  │
  └── Routes mounted:
       /api/auth         → UserRoute.js
       /api/messages     → Chatroute.js
       /api/post         → PostRoute.js
       /api/story        → Stroyrouter.js
       /api/reels        → Reelrouter.js
       /api/engagement   → EngagementRoute.js   ⬅ TWT/Staking
       /api/governance   → GovernanceRoute.js   ⬅ DAO
       /api/ml           → MlRoute.js           ⬅ Python bridge
```

### `Backend/Models/User.js` — The Master Schema

Every user document stored in MongoDB has these critical Web3 fields:

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `walletAddress` | String | Linked Backpack/Phantom public key |
| `twtBalance` | Number | Real claimable TWT (source of truth) |
| `virtualTwtBalance` | Number | Pre-chain earnings from watch sessions |
| `tokensStaked` | Number | Currently locked in smart contract |
| `totalRewardsEarned` | Number | Lifetime rewards accumulated |
| `ivtgClaimed` | Boolean | Initial Virtual Token Grant taken? |
| `isVerified` | Boolean | Human verified by ML |

### `Backend/Models/Engagement_Model.js` — Staking State

One record per user tracking their on-chain stake status:

```js
{
  user: ObjectId → User,
  stakeAmount: Number,          // TWT locked
  stakeStartTime: Date,         // When they staked
  lockDurationDays: Number,     // 1, 7, 30...
  accumulatedWatchTimeMs: Number, // Watch time earned this epoch
  status: "active" | "inactive" | "locked",
  totalRewardsEarned: Number
}
```

### Socket.io Real-Time Events (`Server.js` lines 65-140)

```
User connects → UserSocketMap[userId] = socket.id
User sends message:
  socket.emit("sendMessage") →
    Server looks up receiverSocketId →
      io.to(receiverSocketId).emit("newMessage")

Typing:
  socket.emit("typing") → io.to(receiverSocketId).emit("userTyping")

Online users:
  io.emit("getOnlineUsers", Object.keys(UserSocketMap))
```

---

## 🤖 Layer 2: The Machine Learning Pipeline

This is the most sophisticated architectural layer. Here is the **complete real data flow** based on reading the actual source code.

### The Training Dataset
`1773666452049_vartul_dataset_syn.xlsx` — A synthetic behavioral dataset (2.2 MB) containing thousands of simulated user sessions with columns for every signal below. This is loaded by `utils.load_data()` using `pandas`.

### The 3 Models — Exact Specifications

---

#### **Model 1: Engagement Score** (`model1_engagement.py` → `model1.pkl` 9.9 MB)

**Algorithm:** `RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_leaf=5)`

**Input Features:**
| Feature | What it measures |
| :--- | :--- |
| `watch_time` | Seconds the reel was watched |
| `watch_percentage` | % of video completed |
| `likes` | Likes given this session |
| `shares` | Share actions |
| `comments` | Comments left |
| `save_video` | 0/1 — saved to collection |
| `views` | Total views on post |
| `replay_count` | Times rewound |
| `video_length` | Duration of the video |
| `is_viral_video` | 0/1 flag |

**Output:** `engagement_score` — continuous float (0 → ~162). Higher means more genuine human engagement.

**Then used as:** Input into Model 3's `engagement_score` feature.

---

#### **Model 2: Bot Detection** (`model2_bot_detection.py` → `model2.pkl` 287 KB)

**Algorithms compared:**
1. `RandomForestClassifier(n_estimators=100, max_depth=10, class_weight="balanced")` ← **Primary (best)**
2. `IsolationForest(n_estimators=100, contamination=bot_ratio)` ← Unsupervised backup
3. `LogisticRegression(class_weight="balanced")` ← Baseline

**Input Features (behavioral signals ONLY — no pre-calculated scores):**
| Feature | Bot Signal |
| :--- | :--- |
| `scroll_speed` | Bots scroll 10–20x/sec. Humans: 1–3x/sec |
| `skip_time` | Bots skip immediately (0–1s). Humans: 5–15s |
| `watch_percentage` | Bots watch 1–5%. Humans: 60–90% |
| `session_duration` | Bots: 5–30s sessions. Humans: 5–30 minutes |
| `videos_per_session` | Bots: 100–300. Humans: 3–10 |
| `watch_time` | Bots: 1–2s. Humans: 30–60s |
| `likes` | Bots mass-like (50–200). Humans: 0–5 |
| `shares` | Bots mass-share |
| `stake_amount` | Bots rarely stake TWT |
| `device_type` | 0/1 encoded (mobile/desktop) |
| `network_type` | 0/1 encoded |

**Output (exact from code):**
```python
{
  "is_bot": True / False,
  "bot_probability": 0.0 – 1.0,
  "trust_score": 0 – 100,       # = (1 - bot_prob) * 100
  "action": "allow" | "remove_rewards" | "slash_stake"
}
```

**Action Thresholds:**
```
bot_probability >= 0.70  → "slash_stake"      (cut staking rewards immediately)
bot_probability >= 0.40  → "remove_rewards"   (halt TWT earnings)
bot_probability < 0.40   → "allow"            (normal user, credit rewards)
```

---

#### **Model 3: Feed Ranking + Reward Distribution** (`model3_feed_ranking.py` → `model3.pkl` 581 KB)

**Algorithm:** `GradientBoostingRegressor(n_estimators=150, learning_rate=0.05, max_depth=5)`

**Input Features:**
| Feature | Purpose |
| :--- | :--- |
| `engagement_score` | Output FROM Model 1 (pipeline chaining!) |
| `creator_reputation` | Creator's historical quality score (0–1) |
| `creator_followers` | Follower count |
| `stake_amount` | How much TWT the creator staked |
| `is_viral_video` | 0/1 |
| `watch_percentage` | Watch completion |
| `replay_count` | Rewatches |
| `save_video` | Saved to collection |
| `video_category` | Encoded category |
| `follow_creator` | Does viewer follow creator? |
| `viewer_reward` | TWT rewarded to viewer |
| `video_length` | Duration |
| `views` | Total views |

**Output:** `recommendation_score` 0.0 → 1.0 — determines where this reel appears in your feed.

**Reward Pool Distribution (epoch-based):**
```
Total epoch pool (e.g. 10,000 TWT) splits:
  40% → Creators   (proportional to their total engagement_score share)
  40% → Viewers    (proportional to their watch contribution_score)
  20% → Treasury   (platform reserve for liquidity)
```

---

### The Flask API (`ml_api.py`) — The Single Entry Point

All 3 models are **preloaded at Flask startup** (avoids 500ms cold loading per request):

```python
_model1 = pickle.load("model1.pkl")   # Engagement (Random Forest Regressor)
_model2 = pickle.load("model2.pkl")   # Bot Detection (RF + scaler)
_model3 = pickle.load("model3.pkl")   # Feed Ranking (Gradient Boosting)
```

### Diagram 1 — ML Pipeline (All 3 Models in Sequence)

```mermaid
flowchart TD
    A["🗂️ Raw user session data\nwatch_time, scroll_speed, likes, shares..."]:::input

    subgraph M1["Model 1 — Engagement Scorer"]
        B["RandomForestRegressor\n100 trees · depth 12\nOutput → engagement_score (0 → ~162 float)"]:::model1
    end

    subgraph M2["Model 2 — Bot Detector"]
        C["RandomForestClassifier + IsolationForest + LogisticRegression\nOutput → is_bot, bot_probability, trust_score (0–100), action\nallow / remove_rewards / slash_stake"]:::model2
    end

    subgraph M3["Model 3 — Feed Ranker + Reward Distributor"]
        D["GradientBoostingRegressor · 150 trees · lr 0.05\nOutput → recommendation_score (0.0 → 1.0)\nReward pool split: 40% creators · 40% viewers · 20% treasury"]:::model3
    end

    E["🏆 Final TWT Reward Formula\nTWT = engagement_score × (trust_score / 100)"]:::reward

    A --> M1
    M1 -->|"engagement_score"| M2
    M2 -->|"trust_score + engagement_score"| M3
    M3 --> E

    classDef input    fill:#4a4a4a,stroke:#888,color:#fff
    classDef model1   fill:#3b4fd1,stroke:#6677ff,color:#fff
    classDef model2   fill:#8b3a2a,stroke:#cc5533,color:#fff
    classDef model3   fill:#2a6b4a,stroke:#33aa77,color:#fff
    classDef reward   fill:#8b6010,stroke:#ddaa22,color:#fff
```

---

### Diagram 2 — Bot Detection Decision Tree (Model 2 Internals)

```mermaid
flowchart TD
    A["🔢 Behavioral signals (13 features)\nscroll_speed, skip_time, watch%, session_duration, likes..."]:::input

    B["RandomForestClassifier (primary)\n100 trees · class_weight balanced · depth 10"]:::classifier

    C{"bot_probability (0.0 → 1.0)\ntrust_score = (1 - prob) × 100"}:::decision

    D["⛔ slash_stake\nCut staking rewards\nimmediately"]:::bad
    E["⚠️ remove_rewards\nHalt TWT earnings\nfor this session"]:::warn
    F["✅ allow\nNormal user\nCredit rewards"]:::good

    G["TWT = engagement × trust/100\ne.g. score 85 × 0.92 = 78.2 TWT\nbot: 85 × 0.05 = 4.25 → zeroed"]:::formula

    A --> B
    B --> C
    C -->|"≥ 0.70"| D
    C -->|"0.40 – 0.69"| E
    C -->|"< 0.40"| F
    F --> G
    E --> G

    classDef input      fill:#4a4a4a,stroke:#888,color:#fff
    classDef classifier fill:#3b4fd1,stroke:#6677ff,color:#fff
    classDef decision   fill:#555,stroke:#aaa,color:#fff
    classDef bad        fill:#7a1a1a,stroke:#cc3333,color:#fff
    classDef warn       fill:#7a5a10,stroke:#ccaa22,color:#fff
    classDef good       fill:#1a6a3a,stroke:#33aa66,color:#fff
    classDef formula    fill:#2a6a2a,stroke:#44cc55,color:#fff
```

---

### Diagram 3 — Node.js ↔ Python Communication (Step by Step)

```mermaid
flowchart LR
    subgraph FE["React · Port 5173"]
        A["① User watches reel\nFrontend collects session\nsignals in real-time"]:::fe
    end

    subgraph BE["Node.js Express · Port 5000"]
        B["② EngagementController\nValidates JWT, assembles\nML payload from req.body"]:::node
        D["④ Node processes result\nChecks bot.action field\nComputes final TWT reward\nUpdates MongoDB"]:::node
        E2["⑤ Act on bot.action\nallow → credit virtualTWT\nremove_rewards → skip\nslash_stake → zero out"]:::node
        G["MongoDB update\nvirtualTwtBalance ↑\naccumulatedWatchTime ↑\nisVerified flag set"]:::db
        H["⑥ UI update\nShow earned TWT\nUpdate virtualTwtBalance\nFeed reordered by score"]:::fe
    end

    subgraph PY["Python Flask · Port 5001"]
        C["③ Flask /predict endpoint\nModels preloaded at startup\nRuns M1 → M2 → M3\nin sequence"]:::py
        C2["POST body payload\nwatch_time, watch_%\nlikes, shares, comments\nscroll_speed, skip_time\nstake_amount, views..."]:::payload
        C3["JSON response\nengagement_score: 78.5\nbot.is_bot: false\nbot.trust_score: 92.0\nfeed_score: 0.812"]:::response
    end

    A -->|"axios + JWT\nPOST /api/engagement/logWatchTime"| B
    B -->|"HTTP POST /predict"| C
    C --> C2
    C2 --> C3
    C3 -->|"JSON back"| D
    D --> E2
    E2 --> G
    G --> H

    classDef fe      fill:#3b4fd1,stroke:#6677ff,color:#fff
    classDef node    fill:#2a6b4a,stroke:#33aa77,color:#fff
    classDef py      fill:#2a5a7a,stroke:#3399cc,color:#fff
    classDef payload fill:#4a4a4a,stroke:#888,color:#fff
    classDef response fill:#4a4a4a,stroke:#888,color:#fff
    classDef db      fill:#7a5a10,stroke:#ccaa22,color:#fff
```

**Final Reward Formula** (from `Run_all.py` line 126):
```
Final TWT Reward = engagement_score × (trust_score / 100)

Example:
  Human → score=85, trust=92  → 85 × 0.92 = 78.2 TWT  ✅
  Bot   → score=85, trust=5   → 85 × 0.05 = 4.25 TWT → zeroed ⛔
```

### Node.js ↔ Python API Contract

```js
// Node.js calls Python Flask at:
POST http://localhost:5001/predict
Body: {
  watch_time, watch_percentage, likes, shares, comments,
  scroll_speed, skip_time, session_duration, videos_per_session,
  stake_amount, creator_reputation, creator_followers, views, caption
}

// Python responds:
{
  engagement_score: 78.5,
  bot: { is_bot: false, bot_probability: 0.08, trust_score: 92.0, action: "allow" },
  feed_score: 0.812
}
```


---

## ⛓️ Layer 3: Solana Web3 Blockchain

### `Backend/Blockchain/TokenService.js` — The SPL Oracle

This Node.js module is the bridge between the Express API and the Solana blockchain. It uses `@solana/web3.js` and `@solana/spl-token`.

**How the Airdrop works (exact code flow):**

```
1. Load PLATFORM_PRIVATE_KEY from .env (byte array)
   → Keypair.fromSecretKey(Uint8Array.from(keyArray))
   Platform wallet: dadLVDC7VmD7SZU5iaxzmZkxE8HCYTQLtVY1uaPL9sm

2. Create RPC Connection to Devnet:
   new Connection("https://api.devnet.solana.com", "confirmed")

3. Get/create Platform's Associated Token Account (ATA) for TWT mint

4. Get/create Recipient's ATA (created if first time, platform pays fee)

5. Build SPL Transfer instruction:
   createTransferCheckedInstruction(
     platformATA,           // from
     mintPubKey,            // TWT mint address
     recipientATA,          // to
     platformKeypair,       // authority signer
     rawAmount,             // amount × 10^decimals (6 decimals)
     TOKEN_DECIMALS
   )

6. sendAndConfirmTransaction(conn, tx, [platformKeypair])
   → Returns txSignature on-chain
```

**Functions exposed:**
| Function | What it does |
| :--- | :--- |
| `airdropTWT(wallet, amount)` | Platform → User SPL transfer |
| `getTwtBalance(wallet)` | Read user's on-chain TWT balance |
| `getSolBalance(wallet)` | Read SOL balance for fee checking |
| `getMintInfo()` | Fetch TWT mint supply, decimals |
| `getWalletTransactions(wallet, limit)` | Fetch signature history |
| `verifyTransaction(txSignature)` | Confirm tx finalized |
| `getNetworkInfo()` | Network health, version, current slot |

### `SmartContracts/vartul_engagement/src/lib.rs` — The Rust Contract

**Program ID:** `AehNZSfNSq39vffKLvWouJEhuJgvPmHh6qMNB2LgpNue`

**The 3 PDA Accounts used:**
```
SEED_STATE   = b"engagement_state"  → EngagementState (global platform totals)
SEED_STAKING = b"staking"           → StakingAccount per user (per-wallet state)
SEED_VAULT   = b"vault"             → TokenAccount holding all locked TWT
```

**The 4 Instructions:**

```mermaid
graph LR
    A[initialize] -->|One-time admin setup| B[EngagementState PDA created]
    C[stake amount lock_days] -->|User signs wallet popup| D[CPI: Transfer user ATA → Vault PDA]
    D --> E[StakingAccount.is_active = true]
    F[distribute_viewer_reward watch_pct amount] -->|Platform admin signed| G[CPI: Transfer RewardPool → User ATA]
    H[unstake] -->|User calls after lock expires| I[CPI: Transfer Vault → User ATA]
    I --> J[StakingAccount.is_active = false]
```

**Stake Instruction Detail (lib.rs lines 49-88):**
```rust
pub fn stake(ctx: Context<Stake>, amount: u64, lock_duration_days: u64) -> Result<()> {
    // 1. Validate amount > 0, lock_days >= 1
    // 2. CPI to Solana Token Program:
    //    Transfer { from: user_token_account, to: vault, authority: user }
    // 3. Write to StakingAccount PDA:
    //    amount, lock_duration_days, stake_start = Clock::get().unix_timestamp
    // 4. Increment EngagementState.total_staked
    // 5. emit!(StakeEvent{...}) — on-chain event log
}
```

**Unstake Guard (lib.rs lines 148-151):**
```rust
let lock_seconds = (staking_account.lock_duration_days as i64) * 86400;
let unlock_time = staking_account.stake_start + lock_seconds;
require!(now >= unlock_time, VartulError::StillLocked);
// Cannot withdraw even 1 second early — enforced by blockchain
```

**Reward Distribution Requirement (lib.rs line 101):**
```rust
require!(watch_percentage >= 60, VartulError::InsufficientWatchTime);
// Must watch at least 60% of a reel to qualify for on-chain reward
```

---

## 🔄 Complete End-to-End Workflow

### Flow 1: Watch-to-Earn (Most Common)

```mermaid
sequenceDiagram
    participant U as User Browser (React)
    participant N as Node.js (Port 5000)
    participant P as Python Flask (Port 5001)
    participant M as MongoDB
    participant S as Solana Devnet

    U->>U: Watch reel 48s (80% completion)
    U->>N: POST /api/engagement/logWatchTime {watch_time:48, watch_pct:80, scroll_speed:1.6}
    N->>P: POST /predict {all behavioral signals}
    P->>P: Model1: engagement_score = 78.5
    P->>P: Model2: bot_prob=0.08, action="allow", trust=92
    P->>P: Model3: feed_score = 0.81
    P-->>N: {engagement_score:78.5, bot:{action:"allow"}, feed_score:0.81}
    N->>N: Final reward = 78.5 × 0.92 = 72.2 TWT
    N->>M: User.findByIdAndUpdate { $inc: { virtualTwtBalance: 72.2 } }
    N-->>U: {success: true, earned: 72.2}
```

### Flow 2: Bot Detected

```mermaid
sequenceDiagram
    participant B as Bot Script
    participant N as Node.js
    participant P as Python Flask
    participant M as MongoDB

    B->>N: POST /logWatchTime {scroll_speed:20, videos_per_session:300, watch_pct:1}
    N->>P: POST /predict
    P->>P: Model2: bot_prob=0.97, action="slash_stake"
    P-->>N: {bot: {is_bot: true, action: "slash_stake"}}
    N->>M: User.findByIdAndUpdate { isVerified: false, virtualTwtBalance: 0 }
    N-->>B: 403 Forbidden
```

### Flow 3: Claim Airdrop (Virtual → Real On-Chain)

```mermaid
sequenceDiagram
    participant U as User Browser
    participant N as Node.js
    participant T as TokenService.js
    participant S as Solana Devnet (RPC)
    participant M as MongoDB

    U->>N: POST /api/engagement/airdrop {walletAddress: "BkpXf..."}
    N->>T: airdropTWT("BkpXf...", 100)
    T->>S: getOrCreateAssociatedTokenAccount (platform)
    T->>S: getOrCreateAssociatedTokenAccount (recipient)
    T->>S: sendAndConfirmTransaction(SPL transfer 100 TWT)
    S-->>T: txSignature = "61RJk44..."
    T-->>N: {success: true, txSignature}
    N->>M: User.findByIdAndUpdate { $inc: { twtBalance: 100 } }
    N-->>U: {success: true, signature: "61RJk44...", onChain: true}
```

### Flow 4: Stake Tokens (On-Chain Locking)

```mermaid
sequenceDiagram
    participant U as React + Backpack Wallet
    participant S as Solana Devnet
    participant R as Rust Contract (lib.rs)
    participant N as Node.js

    U->>U: Click "Stake 100 TWT for 7 days"
    U->>U: Build stake() instruction targeting VARTUL_PROGRAM_ID
    U->>S: Backpack prompts → User signs transaction
    S->>R: stake(amount=100, lock_duration_days=7)
    R->>R: Validate: amount > 0, lock_days >= 1
    R->>S: CPI Token Transfer: user_ATA → vault_PDA (100 TWT locked)
    R->>R: Write StakingAccount PDA: stake_start=now, is_active=true
    R->>R: EngagementState.total_staked += 100
    R->>S: emit StakeEvent (on-chain log)
    S-->>U: Transaction Confirmed ✅
    U->>N: POST /api/engagement/stake {amount: 100, durationDays: 7}
    N->>N: Mirror state in MongoDB (Engagement_Model)
```

---

## 📊 Data Flow Summary

```
REACT (Port 5173)
  ↓ axios + JWT header
NODE.JS (Port 5000)
  ↓ HTTP POST
PYTHON FLASK (Port 5001)      ← ML predictions
  ↓ JSON response
NODE.JS
  ↓ mongoose
MONGODB                        ← Social data, balances, engagement state
  ↓ (separately)
NODE.JS → TokenService.js
  ↓ @solana/web3.js RPC
SOLANA DEVNET                  ← Real SPL token movements
  ↓ (staking)
RUST ANCHOR CONTRACT           ← Immutable locking logic
```

---

## 🔑 Environment Variables (`.env`)

| Variable | Used By | Purpose |
|:---|:---|:---|
| `TOKEN_MINT` | TokenService.js | SPL Token mint address |
| `TOKEN_DECIMALS` | TokenService.js | 6 decimals for TWT |
| `PLATFORM_PRIVATE_KEY` | TokenService.js | Platform wallet byte array |
| `SOLANA_RPC` | TokenService.js | Devnet RPC URL |
| `VARTUL_PROGRAM_ID` | EngagementContract.js | Anchor program address |
| `MONGODB_URL` | Config/db.js | MongoDB Atlas connection |
| `REDIS_HOST/PORT/PASS` | Config/redis.js | Redis Cloud connection |
| `JWT_SECRET` | Middleware/isLoggedIn.js | Token signing |
| `CLOUDINARY_*` | Post/Reel controllers | Media upload |
| `ML_SERVICE_URL` | MlRoute.js | `http://localhost:5001` |
