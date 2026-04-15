# VarTul — Complete Project Run Guide
**How to start every service from scratch. Copy-paste ready.**

There are **5 services** to run. Each needs its own terminal.

```
Service 1 │ Backend API        │ Windows Terminal (PowerShell/CMD)
Service 2 │ Frontend UI        │ Windows Terminal (PowerShell/CMD)
Service 3 │ Python ML Server   │ Windows Terminal (PowerShell/CMD)
Service 4 │ Solana Devnet RPC  │ WSL Terminal
Service 5 │ Anchor Smart Cont. │ WSL Terminal (only if redeploying)
```

---

## 🪟 Windows Terminals (PowerShell or CMD)

### Terminal 1 — Backend API (Node.js)

```powershell
cd G:\Vartul_New\VarTul\Backend
npm install
nodemon server.js
```

> ✅ You should see:
> ```
> 🚀 Server running on port 5000
> 🔗 Redis connection established!
> [TokenService] ✅ Loaded TOKEN_MINT: 67iMSE...
> ```

---

### Terminal 2 — Frontend UI (React + Vite)

```powershell
cd G:\Vartul_New\VarTul\Frontend
npm install
npm run dev
```

> ✅ You should see:
> ```
> VITE v7.x.x  ready in 500ms
> ➜  Local:   http://localhost:5173/
> ```

---

### Terminal 3 — Python ML Server (Flask)

```powershell
cd G:\Vartul_New\VarTul\Vartul_ML

# First time only — create virtual environment
python -m venv venv

# Activate it (Windows)
.\venv\Scripts\activate

# Install dependencies (first time only)
pip install flask scikit-learn pandas openpyxl numpy

# Start the ML server
python ml_api.py
```

> ✅ You should see:
> ```
> ✅ All 3 ML models loaded at startup
>  * Running on http://127.0.0.1:5001
> ```

---

## 🐧 WSL Terminals (Ubuntu in WSL)

Open WSL by typing `wsl` in your Windows search bar or Run dialog.

### Terminal 4 — Solana Devnet (Health Check + Token Scripts)

These are one-time/diagnostic commands, not a persistent server.

```bash
# Navigate to the backend (WSL path to your Windows drive)
cd /mnt/g/Vartul_New/VarTul/Backend

# Check Solana CLI is configured for devnet
solana config set --url devnet

# Check your platform wallet balance
solana balance dadLVDC7VmD7SZU5iaxzmZkxE8HCYTQLtVY1uaPL9sm --url devnet

# Check platform wallet TWT token balance (MUST use --env-file=.env)
node --env-file=.env scripts/checkPlatformWallet.js

# (Optional) Add more TWT to platform wallet if it runs low
node --env-file=.env scripts/checkAndFundPlatform.js

# (Optional) Verify the TWT token metadata is set on-chain
node --env-file=.env scripts/addTokenMetadata.js
```

> ✅ Platform wallet should show:
> ```
> SOL Balance  : 0.5+ SOL  ✅
> TWT Balance  : 9,999,000+ TWT  ✅
> ```

---

### Terminal 5 — Anchor Smart Contract (Only if Redeploying)

> ⚠️ **Only run this if you changed `lib.rs` and need to redeploy.**
> The contract is already deployed at `AehNZSfNSq39vffKLvWouJEhuJgvPmHh6qMNB2LgpNue`.

```bash
# Navigate to the smart contract directory
cd /mnt/g/Vartul_New/VarTul/SmartContracts/vartul_engagement

# Check Anchor is installed
anchor --version

# Build the contract (compiles Rust to .so)
anchor build

# Deploy to Solana Devnet
anchor deploy --provider.cluster devnet

# ⚠️ IMPORTANT: After deploying, copy the NEW Program ID
# printed in terminal and update Backend/.env:
# VARTUL_PROGRAM_ID=<new program id here>
```

> ✅ After deploy you should see:
> ```
> Deploying program "vartul_engagement"...
> Program Id: AehNZSfNSq39vffKLvWouJEhuJgvPmHh6qMNB2LgpNue
> Deploy success ✅
> ```

---

## 📋 Startup Order (Important)

Always start services in this order:

```
1. Backend   (needs MongoDB + Redis to be accessible)
2. ML Server (independent, but Backend calls it)
3. Frontend  (makes API calls to Backend on port 5000)
4. Solana    (one-time checks, no persistent process needed)
```

---

## 🔍 Verify Everything is Running

Open your browser and check:

| Service | URL | Expected |
| :--- | :--- | :--- |
| Backend health | `http://localhost:5000/api/status` | `Server is live` |
| ML server | `http://localhost:5001/` | `ML API Running 🚀` |
| Frontend | `http://localhost:5173/` | VarTul login page |

---

## 🚨 Common Issues & Fixes

### Backend won't start
```powershell
# Make sure .env exists in Backend/
# Check it has: MONGODB_URL, JWT_SECRET, TOKEN_MINT, PLATFORM_PRIVATE_KEY

cd G:\Vartul_New\VarTul\Backend
type .env
```

### ML server crashes (model not found)
```powershell
# The .pkl files must exist. Retrain if missing:
cd G:\Vartul_New\VarTul\Vartul_ML
.\venv\Scripts\activate
python Run_all.py
# This trains all 3 models and saves model1.pkl, model2.pkl, model3.pkl
```

### Platform wallet has no SOL (devnet)
```bash
# In WSL — request free devnet SOL
solana airdrop 2 dadLVDC7VmD7SZU5iaxzmZkxE8HCYTQLtVY1uaPL9sm --url devnet
```

### Platform wallet has no TWT tokens
```bash
# In WSL
cd /mnt/g/Vartul_New/VarTul/Backend
node scripts/checkAndFundPlatform.js
```

### Anchor not found in WSL
```bash
# Install Anchor CLI in WSL
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
# OR use AVM (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/avm avm --locked
avm install latest
avm use latest
```

### Solana CLI not found in WSL
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
# Then restart WSL / reload shell:
source ~/.bashrc
```

---

## ⚡ Quick Restart (If Already Set Up)

Once you've done the first-time setup, just do this every session:

```powershell
# Terminal 1 — Backend
cd G:\Vartul_New\VarTul\Backend && nodemon server.js

# Terminal 2 — Frontend
cd G:\Vartul_New\VarTul\Frontend && npm run dev

# Terminal 3 — ML
cd G:\Vartul_New\VarTul\Vartul_ML && .\venv\Scripts\activate && python ml_api.py
```

That's it — no WSL needed unless doing Solana/Anchor work.
