import axiosInstance from "../Utils/axiosInstance";

// Stake TWT for engagement rewards
export const stakeEngagementTokens = async (amount, durationDays) => {
  const { data } = await axiosInstance.post("/api/engagement/stake", { amount, durationDays });
  return data;
};

// Unstake TWT
export const unstakeTokens = async (amount) => {
  const { data } = await axiosInstance.post("/api/engagement/unstake", { amount });
  return data;
};

// Log watch session
export const logWatchSession = async (watchData) => {
  try {
    await axiosInstance.post("/api/engagement/watch", watchData);
    return { success: true };
  } catch { /* Silent – must never break UX */ }
};

// Watch heartbeat (every 5s for W2E)
// Sends session signals to the backend for ML bot detection.
export const sendWatchHeartbeat = async (reelId, signals = {}) => {
  try {
    const { data } = await axiosInstance.post("/api/engagement/heartbeat", {
      videoId: reelId,
      watchTimeMs:      signals.watchTimeMs      ?? 5000,
      watchPercentage:  signals.watchPercentage  ?? 60,
      sessionDuration:  signals.sessionDuration  ?? 600,
      videosPerSession: signals.videosPerSession ?? 6,
      scrollSpeed:      signals.scrollSpeed      ?? 1.5,
      skipTime:         signals.skipTime         ?? 5,
    });
    return data;
  } catch { /* Silent — must never break UX */ }
};

// Get engagement status
export const fetchEngagementStatus = async () => {
  const { data } = await axiosInstance.get("/api/engagement/status");
  return data;
};

// Get dashboard stats
export const fetchDashboardStats = async () => {
  const { data } = await axiosInstance.get("/api/engagement/dashboard-stats");
  return data;
};

// Get reward history
export const fetchRewardHistory = async (limit = 20) => {
  const { data } = await axiosInstance.get(`/api/engagement/reward-history?limit=${limit}`);
  return data;
};

// Get creator earnings
export const fetchCreatorEarnings = async () => {
  const { data } = await axiosInstance.get("/api/engagement/creator-earnings");
  return data;
};

// Get transaction logs
export const fetchTransactionLogs = async (limit = 30, type) => {
  const params = new URLSearchParams({ limit });
  if (type) params.append("type", type);
  const { data } = await axiosInstance.get(`/api/engagement/tx-logs?${params}`);
  return data;
};

// Get token balance (live on-chain)
export const fetchTokenBalance = async () => {
  const { data } = await axiosInstance.get("/api/engagement/token-balance");
  return data;
};

// Get wallet transactions (Solana devnet)
export const fetchWalletTransactions = async (limit = 20) => {
  const { data } = await axiosInstance.get(`/api/engagement/transactions?limit=${limit}`);
  return data;
};

// Airdrop TWT
export const airdropTWT = async (amount = 100, walletAddress) => {
  const { data } = await axiosInstance.post("/api/engagement/airdrop", { amount, walletAddress });
  return data;
};

// Transfer TWT to another user (internal)
export const transferTokens = async (toUserId, amount, note = "") => {
  const { data } = await axiosInstance.post("/api/engagement/transfer", { toUserId, amount, note });
  return data;
};

// Connect wallet
export const connectWallet = async (walletAddress) => {
  const { data } = await axiosInstance.post("/api/auth/connect-wallet", { walletAddress });
  return data;
};

// Claim IVTG
export const claimIVTG = async () => {
  const { data } = await axiosInstance.post("/api/engagement/claim-ivtg");
  return data;
};

// Send tip
export const sendTip = async (toUserId, amount, message = "") => {
  const { data } = await axiosInstance.post("/api/engagement/tip", { toUserId, amount, message });
  return data;
};

// Get tip history
export const fetchTipHistory = async (direction = "both", limit = 20) => {
  const { data } = await axiosInstance.get(`/api/engagement/tips?direction=${direction}&limit=${limit}`);
  return data;
};

// Get token info (public)
export const fetchTokenInfo = async () => {
  const { data } = await axiosInstance.get("/api/engagement/token-info");
  return data;
};

// Stake on creator pool
export const stakeOnCreator = async (creatorId, amount, lockDays = 7) => {
  const { data } = await axiosInstance.post("/api/engagement/creator-stake", { creatorId, amount, lockDays });
  return data;
};

// Get creator stakes (staked by me on others)
export const fetchCreatorStakes = async () => {
  const { data } = await axiosInstance.get("/api/engagement/creator-stakes");
  return data;
};

// ML API
export const checkMlHealth = async () => {
  const { data } = await axiosInstance.get("/api/ml/health");
  return data;
};

export const mlBotCheck = async (payload) => {
  const { data } = await axiosInstance.post("/api/ml/bot-check", payload);
  return data;
};
