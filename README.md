# VarTul

**VarTul** is a full-stack social platform that combines familiar social features—posts, stories, short-form reels, direct messaging, and profiles—with **Solana** wallet connectivity and on-chain **engagement staking**. The application pairs a React (Vite) frontend, a Node.js API backed by MongoDB and Redis, and an **Anchor** program for proof-of-stake style engagement on Solana.

---

## Features

- **Social feed & content** — Posts, stories, reels, saved posts, follows, and notifications.
- **Real-time chat** — Socket.io for messaging, typing indicators, read receipts, and online presence.
- **Authentication** — JWT-based sessions with profile setup flows for new users.
- **Web3** — Solana wallet adapter integration; token-related flows and creator-facing dashboard (wallet, staking, rewards, transactions, earnings).
- **Engagement & governance** — API routes for engagement and governance; on-chain staking contract for TWT-style engagement mechanics (see smart contracts).
- **Media** — Cloudinary for uploads; Pinata-backed IPFS helpers for decentralized asset references where configured.

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Redux Toolkit, React Router, Socket.io client, Solana wallet adapters (`@solana/web3.js`, SPL Token) |
| **Backend** | Express 5, Mongoose (MongoDB), Redis, Socket.io, JWT, Cloudinary, rate limiting (Helmet, express-rate-limit) |
| **Blockchain** | Solana (Anchor 0.30, Rust), SPL tokens; optional Ethers/Web3 utilities in the backend where used |

---

## Repository layout

```
VarTul/
├── Frontend/          # Vite + React SPA
├── Backend/           # Express API + Socket.io server
└── SmartContracts/
    └── vartul_engagement/   # Anchor program (engagement staking)
```

---

## Prerequisites

- **Node.js** (LTS recommended) and npm  
- **MongoDB** (connection string)  
- **Redis** (for caching / session-related usage as configured)  
- **Solana CLI / Anchor** (only if you build or deploy the smart contract)

---

## Environment variables

### Backend (`Backend/.env`)

Create a `.env` file in `Backend/` with values appropriate for your environment. The codebase expects variables such as:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URL` | MongoDB connection string (database name may be appended in code) |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | API port (defaults to **5000** if unset) |
| `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_TLS` | Redis Cloud / instance connection |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media uploads |
| `PINATA_API_KEY`, `PINATA_SECRET_API_KEY`, `IPFS_GATEWAY` | IPFS / Pinata (optional overrides) |
| `SOLANA_NETWORK`, `SOLANA_RPC`, `TOKEN_MINT`, `TOKEN_DECIMALS`, `PLATFORM_PRIVATE_KEY` | Solana token and platform operations |
| `VARTUL_PROGRAM_ID` | Deployed Anchor program ID for engagement |

### Frontend (`Frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_BACKEND_URL` | HTTP origin of the Express server (e.g. `http://localhost:5000`). Client requests use paths such as `/api/auth/...`; do not append `/api` to this variable. |

> **CORS:** The backend is configured with `origin: "http://localhost:5173"` for local Vite development. Update CORS in `Backend/server.js` when deploying to another host or port.

---

## Local development

### 1. Backend

```bash
cd Backend
npm install
npm run dev
```

The server listens on `PORT` or **5000** and exposes routes under `/api/*` (e.g. `/api/auth`, `/api/messages`, `/api/post`, `/api/reels`, `/api/engagement`, `/api/governance`). A simple health check is available at `/api/status`.

### 2. Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env` with `VITE_BACKEND_URL` pointing at your API.

```bash
npm run dev
```

The dev server defaults to **http://localhost:5173**.

### 3. Smart contract (optional)

From `SmartContracts/vartul_engagement/`:

- Install the [Anchor](https://www.anchor-lang.com/) toolchain and Solana CLI as per Anchor docs.
- Replace the program ID in `src/lib.rs` (`declare_id!`) with your deployed program ID after deployment.
- Build and deploy (e.g. `anchor build`, `anchor deploy --provider.cluster devnet`), then set `VARTUL_PROGRAM_ID` in the backend `.env`.

Inline comments in `src/lib.rs` describe initialization, staking PDAs, and related instructions.

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `Frontend/` | `npm run dev` | Start Vite dev server |
| `Frontend/` | `npm run build` | Production build |
| `Frontend/` | `npm run lint` | ESLint |
| `Backend/` | `npm run dev` | API with nodemon |
| `Backend/` | `npm start` | Run API with Node |

---

## Security notes

- Never commit `.env` files or private keys. The repository `.gitignore` excludes common env patterns.
- Rotate `JWT_SECRET` and cloud/API keys for production.
- Restrict CORS and Socket.io origins to trusted front-end URLs in production.

---

## License

See individual `package.json` files in `Frontend/` and `Backend/` for package licensing. Add a top-level license file if you want a single project-wide license.
# Vartul
