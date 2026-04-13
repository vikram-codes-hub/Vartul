/**
 * Solana.js — Legacy compatibility shim
 * =======================================
 * All real blockchain logic has been moved to TokenService.js
 * which uses the correct TOKEN_MINT env var and platform keypair.
 * This file re-exports from TokenService for backward compatibility.
 */
export {
  default,
  getSolBalance,
  getTwtBalance,
  verifyTransaction,
  getWalletTransactions as getRecentTransactions,
  getNetworkInfo,
} from "./TokenService.js";

