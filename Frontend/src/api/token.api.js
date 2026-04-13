import axiosInstance from "../Utils/axiosInstance";

// ── Token Info (mint, supply, explorer link) ──────────────────────────────────
export const fetchTokenInfo = async () => {
  const res = await axiosInstance.get("/api/engagement/token-info");
  return res.data;
};

// ── Live On-Chain Token Balance for auth user ─────────────────────────────────
export const fetchTokenBalance = async () => {
  const res = await axiosInstance.get("/api/engagement/token-balance");
  return res.data;
};

// ── Wallet Transactions from Solana Devnet ────────────────────────────────────
export const fetchWalletTransactions = async (limit = 15) => {
  const res = await axiosInstance.get(`/api/engagement/transactions?limit=${limit}`);
  return res.data;
};

// ── Request TWT Airdrop (Devnet testing / rewards) ────────────────────────────
export const requestAirdrop = async (amount = 100, walletAddress = null) => {
  const body = { amount };
  if (walletAddress) body.walletAddress = walletAddress;
  const res = await axiosInstance.post("/api/engagement/airdrop", body);
  return res.data;
};
