/**
 * TokenService.js — Real SPL Token Transfer Service
 * ====================================================
 * Uses the platform authority wallet (PLATFORM_PRIVATE_KEY from .env)
 * to perform real on-chain SPL token transfers on Solana Devnet.
 *
 * Token: TWT (Vartul Token)
 * Mint:  mntLxYdw5vwVHdigDwzrHEDWRP9ryPZj7pgN86HF5o9
 * Net:   Devnet
 */

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferCheckedInstruction,
  getMint,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// ── Config ──────────────────────────────────────────────────────────────────
const RPC_URL = process.env.SOLANA_RPC || clusterApiUrl("devnet");
const NETWORK = RPC_URL.includes("devnet") ? "devnet" : (process.env.SOLANA_NETWORK || "devnet");
const TOKEN_MINT = process.env.TOKEN_MINT;
const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || "6");

if (!TOKEN_MINT) {
  console.error("[TokenService] ❌ TOKEN_MINT is not set in .env!");
} else {
  console.log(`[TokenService] ✅ Loaded TOKEN_MINT: ${TOKEN_MINT} | Network: ${NETWORK}`);
}

// ── Singleton Connection ────────────────────────────────────────────────────
let _connection = null;
const getConnection = () => {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed");
  }
  return _connection;
};

// ── Load Platform Authority Keypair ────────────────────────────────────────
let _platformKeypair = null;
export const getPlatformKeypair = () => {
  if (_platformKeypair) return _platformKeypair;
  try {
    const rawKey = process.env.PLATFORM_PRIVATE_KEY;
    if (!rawKey) throw new Error("PLATFORM_PRIVATE_KEY not set in .env");
    const keyArray = JSON.parse(rawKey);
    _platformKeypair = Keypair.fromSecretKey(Uint8Array.from(keyArray));
    console.log(`[TokenService] Platform wallet: ${_platformKeypair.publicKey.toString()}`);
    return _platformKeypair;
  } catch (err) {
    console.error("[TokenService] Failed to load platform keypair:", err.message);
    return null;
  }
};

// ── Get Mint Info ────────────────────────────────────────────────────────────
export const getMintInfo = async () => {
  try {
    const conn = getConnection();
    const mintPubKey = new PublicKey(TOKEN_MINT);
    const mintInfo = await getMint(conn, mintPubKey);
    return {
      mintAddress: TOKEN_MINT,
      decimals: mintInfo.decimals,
      supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
      rawSupply: mintInfo.supply.toString(),
      mintAuthority: mintInfo.mintAuthority?.toString() || null,
      freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
      isInitialized: mintInfo.isInitialized,
      network: NETWORK,
      explorerUrl: `https://explorer.solana.com/address/${TOKEN_MINT}?cluster=${NETWORK}`,
    };
  } catch (err) {
    console.error("[TokenService] getMintInfo error:", String(err));
    // Return static info as fallback
    return {
      mintAddress: TOKEN_MINT,
      decimals: TOKEN_DECIMALS,
      supply: null,
      network: NETWORK,
      explorerUrl: `https://explorer.solana.com/address/${TOKEN_MINT}?cluster=${NETWORK}`,
      error: String(err),
    };
  }
};

// ── Get TWT Balance for a Wallet ─────────────────────────────────────────────
export const getTwtBalance = async (walletAddress) => {
  try {
    const conn = getConnection();
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(TOKEN_MINT);
    const tokenAccountAddr = await getAssociatedTokenAddress(mint, owner);

    const accountInfo = await getAccount(conn, tokenAccountAddr);
    return Number(accountInfo.amount) / Math.pow(10, TOKEN_DECIMALS);
  } catch (err) {
    // Token account doesn't exist yet — user has 0 TWT
    if (err.message?.includes("could not find account") || err.name === "TokenAccountNotFoundError") {
      return 0;
    }
    console.warn("[TokenService] getTwtBalance:", err.message);
    return 0;
  }
};

// ── Get SOL Balance ──────────────────────────────────────────────────────────
export const getSolBalance = async (walletAddress) => {
  try {
    const conn = getConnection();
    const pubKey = new PublicKey(walletAddress);
    const lamports = await conn.getBalance(pubKey);
    return lamports / 1e9;
  } catch (err) {
    console.error("[TokenService] getSolBalance error:", err.message);
    return 0;
  }
};

// ── Airdrop TWT to a User Wallet (Platform → User) ───────────────────────────
export const airdropTWT = async (recipientWalletAddress, amount) => {
  const platformKeypair = getPlatformKeypair();
  if (!platformKeypair) {
    throw new Error("Platform keypair not configured. Check PLATFORM_PRIVATE_KEY in .env");
  }

  try {
    const conn = getConnection();
    const mintPubKey = new PublicKey(TOKEN_MINT);
    const recipientPubKey = new PublicKey(recipientWalletAddress);

    // Get or create the platform's token account
    const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
      conn,
      platformKeypair,
      mintPubKey,
      platformKeypair.publicKey
    );

    // Get or create the recipient's token account  
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      conn,
      platformKeypair, // pays for creating account
      mintPubKey,
      recipientPubKey
    );

    // Amount in raw token units
    const rawAmount = BigInt(Math.round(amount * Math.pow(10, TOKEN_DECIMALS)));

    // Build transfer instruction
    const transferIx = createTransferCheckedInstruction(
      platformTokenAccount.address,
      mintPubKey,
      recipientTokenAccount.address,
      platformKeypair.publicKey,
      rawAmount,
      TOKEN_DECIMALS
    );

    const tx = new Transaction().add(transferIx);
    const txSignature = await sendAndConfirmTransaction(conn, tx, [platformKeypair]);

    console.log(`[TokenService] ✅ Airdropped ${amount} TWT to ${recipientWalletAddress} | TX: ${txSignature}`);
    return {
      success: true,
      txSignature,
      amount,
      recipient: recipientWalletAddress,
      explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=${NETWORK}`,
    };
  } catch (err) {
    console.error(`[TokenService] airdropTWT error (${amount} TWT → ${recipientWalletAddress}):`, String(err));
    console.error(`[TokenService] airdropTWT full error:`, err);
    throw err;
  }
};

// ── Get Recent Transactions for a Wallet ────────────────────────────────────
export const getWalletTransactions = async (walletAddress, limit = 15) => {
  try {
    const conn = getConnection();
    const pubKey = new PublicKey(walletAddress);
    const signatures = await conn.getSignaturesForAddress(pubKey, { limit });

    // Fetch transaction details
    const txDetails = await Promise.allSettled(
      signatures.slice(0, limit).map(async (sig) => {
        return {
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime,
          blockTimeFormatted: sig.blockTime
            ? new Date(sig.blockTime * 1000).toISOString()
            : null,
          err: sig.err,
          memo: sig.memo,
          status: sig.err ? "failed" : "confirmed",
          explorerUrl: `https://explorer.solana.com/tx/${sig.signature}?cluster=${NETWORK}`,
        };
      })
    );

    return txDetails
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
  } catch (err) {
    console.error("[TokenService] getWalletTransactions error:", err.message);
    return [];
  }
};

// ── Verify a Transaction ─────────────────────────────────────────────────────
export const verifyTransaction = async (txSignature) => {
  try {
    const conn = getConnection();
    const status = await conn.getSignatureStatus(txSignature);
    return (
      status?.value?.confirmationStatus === "confirmed" ||
      status?.value?.confirmationStatus === "finalized"
    );
  } catch (err) {
    console.error("[TokenService] verifyTransaction error:", err.message);
    return false;
  }
};

// ── Get Network Info ─────────────────────────────────────────────────────────
export const getNetworkInfo = async () => {
  try {
    const conn = getConnection();
    const [version, slot] = await Promise.all([conn.getVersion(), conn.getSlot()]);
    return { network: NETWORK, rpcUrl: RPC_URL, version, slot, healthy: true };
  } catch (err) {
    return { network: NETWORK, healthy: false, error: err.message };
  }
};

export default {
  getMintInfo,
  getTwtBalance,
  getSolBalance,
  airdropTWT,
  getWalletTransactions,
  verifyTransaction,
  getNetworkInfo,
  getPlatformKeypair,
  TOKEN_MINT,
  TOKEN_DECIMALS,
  NETWORK,
};
