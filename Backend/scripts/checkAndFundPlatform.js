/**
 * checkAndFundPlatform.js
 * -----------------------
 * Checks the platform wallet's TWT balance on devnet.
 * If empty, mints tokens to it using the mint authority.
 *
 * Run: node scripts/checkAndFundPlatform.js
 */

import dotenv from "dotenv";
dotenv.config();

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

const NETWORK = process.env.SOLANA_NETWORK || "devnet";
const RPC_URL = process.env.SOLANA_RPC || clusterApiUrl("devnet");
const TOKEN_MINT = process.env.TOKEN_MINT;
const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || "6");
const MINT_AMOUNT = 1_000_000; // 1 million TWT for the platform to distribute

const conn = new Connection(RPC_URL, "confirmed");

// Load platform keypair
const rawKey = JSON.parse(process.env.PLATFORM_PRIVATE_KEY);
const platformKp = Keypair.fromSecretKey(Uint8Array.from(rawKey));

console.log("=".repeat(60));
console.log("🔍  Platform Wallet:", platformKp.publicKey.toString());
console.log("🪙  Token Mint:     ", TOKEN_MINT);
console.log("🌐  Network:        ", NETWORK);
console.log("=".repeat(60));

async function main() {
  // 1. Check SOL balance
  const solLamports = await conn.getBalance(platformKp.publicKey);
  const solBal = solLamports / 1e9;
  console.log(`\n💰 SOL Balance: ${solBal} SOL`);

  if (solBal < 0.05) {
    console.log("⚠️  Low SOL! Requesting airdrop of 2 SOL...");
    try {
      const sig = await conn.requestAirdrop(platformKp.publicKey, 2e9);
      await conn.confirmTransaction(sig);
      console.log("✅ SOL Airdrop confirmed!");
    } catch (e) {
      console.error("❌ SOL Airdrop failed:", e.message);
      console.log("   Try manually: solana airdrop 2 " + platformKp.publicKey.toString() + " --url devnet");
    }
  }

  // 2. Check TWT balance
  const mintPubKey = new PublicKey(TOKEN_MINT);
  
  // Verify mint exists and get mint authority
  let mintInfo;
  try {
    mintInfo = await getMint(conn, mintPubKey);
    console.log(`\n🪙  Mint Supply: ${Number(mintInfo.supply) / Math.pow(10, TOKEN_DECIMALS)} TWT`);
    console.log(`   Mint Authority: ${mintInfo.mintAuthority?.toString() || "None"}`);
    console.log(`   Is Platform mint authority: ${mintInfo.mintAuthority?.toString() === platformKp.publicKey.toString()}`);
  } catch (e) {
    console.error("❌ Cannot fetch mint info:", e.message);
    console.log("   The TOKEN_MINT in .env may be wrong or not on this network.");
    process.exit(1);
  }

  // Get or create platform token account
  const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
    conn,
    platformKp,
    mintPubKey,
    platformKp.publicKey
  );

  const twtBal = Number(platformTokenAccount.amount) / Math.pow(10, TOKEN_DECIMALS);
  console.log(`\n💎 Platform TWT Balance: ${twtBal} TWT`);

  if (twtBal > 0) {
    console.log("\n✅ Platform wallet already has TWT tokens!");
    console.log("   Airdrops to users should work on-chain.");
    
    // Show example: airdrop 100 to a test wallet would need this balance
    console.log(`\n📊 Can airdrop to ~${Math.floor(twtBal / 100)} users (100 TWT each)`);
    return;
  }

  // 3. Try to mint tokens to platform wallet
  console.log("\n⚠️  Platform has 0 TWT. Attempting to mint...");

  const isPlatformMintAuth = mintInfo.mintAuthority?.toString() === platformKp.publicKey.toString();

  if (!isPlatformMintAuth) {
    console.log("\n❌ CANNOT MINT: Platform wallet is NOT the mint authority.");
    console.log("   Mint authority is:", mintInfo.mintAuthority?.toString() || "None (frozen)");
    console.log("\n📋 MANUAL FIX OPTIONS:");
    console.log("   Option 1 — Run in WSL/terminal (if you have the mint authority keypair):");
    console.log(`   spl-token mint ${TOKEN_MINT} 1000000 ${platformTokenAccount.address.toString()}`);
    console.log("\n   Option 2 — Create a new mint where your platform wallet IS the authority:");
    console.log("   node scripts/createNewMint.js");
    process.exit(1);
  }

  // Mint MINT_AMOUNT TWT to platform wallet
  const rawAmount = BigInt(Math.round(MINT_AMOUNT * Math.pow(10, TOKEN_DECIMALS)));
  console.log(`\n🔨 Minting ${MINT_AMOUNT} TWT to platform wallet...`);

  try {
    const sig = await mintTo(
      conn,
      platformKp,         // fee payer
      mintPubKey,          // mint
      platformTokenAccount.address, // destination
      platformKp,          // mint authority
      rawAmount
    );
    console.log(`✅ Minted! TX: ${sig}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${sig}?cluster=${NETWORK}`);

    // Verify new balance
    const acct = await getAccount(conn, platformTokenAccount.address);
    const newBal = Number(acct.amount) / Math.pow(10, TOKEN_DECIMALS);
    console.log(`\n💎 New Platform TWT Balance: ${newBal} TWT`);
    console.log(`📊 Can now airdrop to ~${Math.floor(newBal / 100)} users (100 TWT each)`);
    console.log("\n✅ Platform wallet funded! Airdrops will now work on-chain.");
    console.log("   Tokens WILL show in Backpack/Phantom when you add the TWT mint.");
  } catch (e) {
    console.error("❌ Mint failed:", e.message);
  }
}

main().catch(console.error);
