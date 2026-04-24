/**
 * checkPlatformWallet.js
 * 
 * Run this ONCE before your demo to verify the platform wallet
 * has enough SOL (for fees) and TWT (to airdrop to users).
 *
 * Usage (in WSL or any terminal with Node 16+):
 *   cd /mnt/g/Vartul_New/VarTul/Backend
 *   node --env-file=.env scripts/checkPlatformWallet.js
 *
 *  OR on Windows PowerShell:
 *   cd g:\Vartul_New\VarTul\Backend
 *   node --env-file=.env scripts/checkPlatformWallet.js
 */

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  getMint,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

// Load env
const RPC_URL  = process.env.SOLANA_RPC || clusterApiUrl("devnet");
const MINT_ADDR = process.env.TOKEN_MINT;
const DECIMALS  = parseInt(process.env.TOKEN_DECIMALS || "6");
const RAW_KEY   = process.env.PLATFORM_PRIVATE_KEY;

if (!MINT_ADDR || !RAW_KEY) {
  console.error("❌  TOKEN_MINT or PLATFORM_PRIVATE_KEY not set in .env");
  process.exit(1);
}

const conn       = new Connection(RPC_URL, "confirmed");
const keyArray   = JSON.parse(RAW_KEY);
const platform   = Keypair.fromSecretKey(Uint8Array.from(keyArray));
const mintPubkey = new PublicKey(MINT_ADDR);

console.log("\n═══════════════════════════════════════════════════");
console.log("   Vartul Platform Wallet Health Check");
console.log("═══════════════════════════════════════════════════");
console.log(`🔗  RPC       : ${RPC_URL}`);
console.log(`🏦  Wallet    : ${platform.publicKey.toString()}`);
console.log(`🪙  Token Mint: ${MINT_ADDR}`);
console.log("───────────────────────────────────────────────────\n");

async function main() {
  // 1. SOL Balance
  const lamports = await conn.getBalance(platform.publicKey);
  const sol = lamports / LAMPORTS_PER_SOL;
  console.log(`SOL Balance  : ${sol.toFixed(4)} SOL ${sol < 0.05 ? "⚠️  LOW — need airdrop!" : "✅"}`);

  if (sol < 0.05 && RPC_URL.includes("devnet")) {
    console.log("\n🚨  Platform wallet needs SOL for transaction fees!");
    console.log("   Run this command to get free devnet SOL:");
    console.log(`\n   solana airdrop 2 ${platform.publicKey.toString()} --url devnet\n`);
    console.log("   OR visit: https://faucet.solana.com");
    console.log(`   Paste your wallet: ${platform.publicKey.toString()}\n`);
  }

  // 2. Verify token mint exists
  try {
    const mintInfo = await getMint(conn, mintPubkey);
    console.log(`Token Mint   : ✅ Exists on-chain`);
    console.log(`  Decimals   : ${mintInfo.decimals}`);
    console.log(`  Supply     : ${(Number(mintInfo.supply) / 10 ** mintInfo.decimals).toLocaleString()} TWT`);
  } catch (err) {
    console.log(`Token Mint   : ❌ NOT FOUND on this network!`);
    console.log(`  Error      : ${err.message}`);
    console.log("\n  ⚠️  Make sure SOLANA_RPC in .env points to the correct network.");
    console.log("  The token exists on Devnet. Set: SOLANA_RPC=https://api.devnet.solana.com");
    process.exit(1);
  }

  // 3. Platform TWT token account balance
  try {
    const ata = await getAssociatedTokenAddress(mintPubkey, platform.publicKey);
    const account = await getAccount(conn, ata);
    const twtBal = Number(account.amount) / 10 ** DECIMALS;

    console.log(`TWT Balance  : ${twtBal.toLocaleString()} TWT ${twtBal < 100 ? "⚠️  LOW" : "✅"}`);
    console.log(`  ATA        : ${ata.toString()}`);

    if (twtBal < 100) {
      console.log("\n🚨  Platform wallet has low TWT balance!");
      console.log("   To mint more TWT to the platform wallet, run:");
      console.log(`\n   spl-token mint ${MINT_ADDR} 1000000 ${ata.toString()} --url devnet\n`);
      console.log("   (You must be the mint authority to do this)\n");
    }
  } catch (err) {
    if (err.name === "TokenAccountNotFoundError" || err.message?.includes("could not find account")) {
      console.log(`TWT Balance  : ⚠️  No TWT token account yet.`);
      console.log("   The platform wallet has no TWT. You need to:");
      console.log(`   1. Create a token account: spl-token create-account ${MINT_ADDR} --owner ${platform.publicKey.toString()} --url devnet`);
      console.log(`   2. Mint tokens to it:      spl-token mint ${MINT_ADDR} 1000000 --url devnet`);
    } else {
      console.log(`TWT Balance  : ❌ Error — ${err.message}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  if (sol >= 0.05) {
    console.log("✅  Platform wallet is ready! You can run the demo.");
  } else {
    console.log("⚠️  Fund the platform wallet before running the demo.");
  }
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
