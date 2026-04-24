import express from "express";
import {
  stakeEngagement,
  logWatchTime,
  calculateRewards,
  getEngagementStatus,
  getDashboardStats,
  getTokenInfo,
  getTokenBalance,
  getWalletTransactions,
  airdropTokens,
  claimIVTG,
  watchHeartbeat,
  sendTip,
  getTipHistory,
  stakeOnCreator,
  getCreatorStakes,
  // New endpoints
  unstakeEngagement,
  getRewardHistory,
  getCreatorEarnings,
  transferTokens,
  getTransactionLogs,
} from "../Controllers/EngagementController.js";
import { isLoggedIn } from "../Middelwares/Isloggeddin.js";

const router = express.Router();

// Engagement / staking
router.post("/stake", isLoggedIn, stakeEngagement);
router.post("/unstake", isLoggedIn, unstakeEngagement);
router.post("/watch", isLoggedIn, logWatchTime);
router.post("/distribute", isLoggedIn, calculateRewards); // ⚠️ Admin-only in production
router.get("/status", isLoggedIn, getEngagementStatus);
router.get("/dashboard-stats", isLoggedIn, getDashboardStats);

// Token / blockchain
router.get("/token-info", getTokenInfo);                          // Public
router.get("/token-balance", isLoggedIn, getTokenBalance);        // Live on-chain balance
router.get("/transactions", isLoggedIn, getWalletTransactions);   // Solana devnet tx history
router.post("/airdrop", isLoggedIn, airdropTokens);               // Airdrop TWT
router.post("/transfer", isLoggedIn, transferTokens);             // Internal token transfer

// IVTG — Initial Virtual Token Grant
router.post("/claim-ivtg", isLoggedIn, claimIVTG);

// Watch-to-Earn heartbeat
router.post("/heartbeat", isLoggedIn, watchHeartbeat);

// Tipping
router.post("/tip", isLoggedIn, sendTip);
router.get("/tips", isLoggedIn, getTipHistory);

// Creator staking pools
router.post("/creator-stake", isLoggedIn, stakeOnCreator);
router.get("/creator-stakes", isLoggedIn, getCreatorStakes);

// History & earnings
router.get("/reward-history", isLoggedIn, getRewardHistory);
router.get("/creator-earnings", isLoggedIn, getCreatorEarnings);
router.get("/tx-logs", isLoggedIn, getTransactionLogs);

export default router;
