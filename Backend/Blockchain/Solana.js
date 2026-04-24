/**
 * Solana.js — Legacy compatibility shim
  *
 * all real Solana interactions  are now handled in TokenService.js
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

