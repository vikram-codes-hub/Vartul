/**
 * setupDevnetToken.js — One-time Devnet TWT Token Setup
 * 
 * Run from Backend/ directory:
 *   node scripts/setupDevnetToken.js
 *
 * This script will:
 *   1. Load the platform keypair from PLATFORM_PRIVATE_KEY in .env
 *   2. Airdrop SOL to platform wallet if needed
 *   3. Create a new SPL token mint (TWT) on devnet
 *   4. Mint 10,000,000 TWT to the platform wallet
 *   5. Print the new TOKEN_MINT address and instructions
 */

import dotenv from "dotenv";
dotenv.config();

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
const RPC_URL = process.env.SOLANA_RPC || clusterApiUrl("devnet");
const TOKEN_DECIMALS = 6;
const INITIAL_SUPPLY = 10_000_000; // 10 million TWT

const conn = new Connection(RPC_URL, "confirmed");

// Load platform keypair
let platformKp;
try {
  const rawKey = JSON.parse(process.env.PLATFORM_PRIVATE_KEY);
  platformKp = Keypair.fromSecretKey(Uint8Array.from(rawKey));
} catch (e) {
  console.error("❌ Failed to parse PLATFORM_PRIVATE_KEY from .env:", e.message);
  process.exit(1);
}

console.log("\n" + "=".repeat(65));
console.log("🚀  Vartul TWT Token — Devnet Setup");
console.log("=".repeat(65));
console.log("📍 Platform Wallet :", platformKp.publicKey.toString());
console.log("🌐 RPC             :", RPC_URL);
console.log("=".repeat(65) + "\n");

async function ensureSol(minSol = 0.5) {
  const lamports = await conn.getBalance(platformKp.publicKey);
  const sol = lamports / LAMPORTS_PER_SOL;
  console.log(`💰 SOL Balance: ${sol.toFixed(4)} SOL`);

  if (sol < minSol) {
    console.log(`⚡ Requesting SOL airdrop (need ≥${minSol} SOL)...`);
    try {
      const sig = await conn.requestAirdrop(platformKp.publicKey, 2 * LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig, "confirmed");
      const newBal = (await conn.getBalance(platformKp.publicKey)) / LAMPORTS_PER_SOL;
      console.log(`✅ SOL airdrop done! New balance: ${newBal.toFixed(4)} SOL\n`);
    } catch (e) {
      console.warn(`⚠️  SOL airdrop failed: ${e.message}`);
      console.warn("   You may run into issues. Try: solana airdrop 2 " + platformKp.publicKey.toString() + " --url devnet\n");
    }
  }
}

async function createTwtMint() {
  console.log("🪙  Creating TWT SPL Token Mint on devnet...");

  const mint = await createMint(
    conn,
    platformKp,              // Fee payer
    platformKp.publicKey,    // Mint authority (platform can mint tokens)
    platformKp.publicKey,    // Freeze authority (platform can freeze)
    TOKEN_DECIMALS
  );

  console.log(`✅ Mint created: ${mint.toString()}`);
  return mint;
}

async function mintInitialSupply(mint) {
  console.log(`\n💎 Minting ${INITIAL_SUPPLY.toLocaleString()} TWT to platform wallet...`);

  // Get/create platform's token account
  const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
    conn,
    platformKp,
    mint,
    platformKp.publicKey
  );
  console.log(`   Platform token account: ${platformTokenAccount.address.toString()}`);

  // Mint tokens
  const rawAmount = BigInt(INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS));
  const sig = await mintTo(
    conn,
    platformKp,
    mint,
    platformTokenAccount.address,
    platformKp,       // mint authority
    rawAmount
  );

  console.log(`✅ Minted! TX: ${sig}`);
  console.log(`   Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet\n`);

  // Verify
  const info = await getMint(conn, mint);
  const supply = Number(info.supply) / Math.pow(10, TOKEN_DECIMALS);
  console.log(`💎 Total supply on-chain: ${supply.toLocaleString()} TWT`);

  return sig;
}

function updateEnvFile(mintAddress) {
  const envPath = path.resolve(__dirname, "../.env");
  let content = fs.readFileSync(envPath, "utf8");

  // Replace or add TOKEN_MINT
  if (content.includes("TOKEN_MINT=")) {
    content = content.replace(/TOKEN_MINT=.*/g, `TOKEN_MINT=${mintAddress}`);
  } else {
    content += `\nTOKEN_MINT=${mintAddress}\n`;
  }

  // Ensure TOKEN_DECIMALS is set
  if (!content.includes("TOKEN_DECIMALS=")) {
    content += `TOKEN_DECIMALS=${TOKEN_DECIMALS}\n`;
  }

  fs.writeFileSync(envPath, content, "utf8");
  console.log(`\n✅ .env updated with TOKEN_MINT=${mintAddress}`);
}

async function main() {
  // Step 1: Ensure platform wallet has SOL
  await ensureSol(0.3);

  // Step 2: Create the mint
  const mint = await createTwtMint();
  const mintAddress = mint.toString();

  // Step 3: Mint initial supply
  await mintInitialSupply(mint);

  // Step 4: Update .env
  updateEnvFile(mintAddress);

  // Final summary
  console.log("\n" + "=".repeat(65));
  console.log("🎉  SETUP COMPLETE!");
  console.log("=".repeat(65));
  console.log(`\n🪙  TWT Mint Address : ${mintAddress}`);
  console.log(`🌐  Network          : devnet`);
  console.log(`💎  Platform Supply  : ${INITIAL_SUPPLY.toLocaleString()} TWT ready to distribute`);
  console.log(`\n📋  Next Steps:`);
  console.log(`   1. Restart your backend:  nodemon server.js`);
  console.log(`   2. Open Backpack wallet → Switch to Devnet`);
  console.log(`   3. In Backpack: + → Add Token → paste this address:`);
  console.log(`      ${mintAddress}`);
  console.log(`   4. Click "Claim 100 TWT" in the app → tokens appear in Backpack ✅`);
  console.log("\n" + "=".repeat(65) + "\n");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
