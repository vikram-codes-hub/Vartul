/**
 * testAirdrop.js — Quick on-chain airdrop test
 * Run: node scripts/testAirdrop.js
 */
import dotenv from "dotenv";
dotenv.config();

import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferCheckedInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC || clusterApiUrl("devnet");
const TOKEN_MINT = process.env.TOKEN_MINT;
const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || "6");

// The user's wallet address (connected wallet in the app)
const RECIPIENT = "ESRDnYF8dwyLcn4owVF2zFCtGUnr8Xkk55vEZqFf6eRo";
const AMOUNT = 100;

const conn = new Connection(RPC_URL, "confirmed");
const rawKey = JSON.parse(process.env.PLATFORM_PRIVATE_KEY);
const platformKp = Keypair.fromSecretKey(Uint8Array.from(rawKey));

console.log("=".repeat(60));
console.log("🧪 TWT Airdrop Diagnostic Test");
console.log("=".repeat(60));
console.log("Platform wallet:", platformKp.publicKey.toString());
console.log("Recipient      :", RECIPIENT);
console.log("Token Mint     :", TOKEN_MINT);
console.log("Amount         :", AMOUNT, "TWT");
console.log("RPC            :", RPC_URL);
console.log("=".repeat(60) + "\n");

async function test() {
  // Step 1: Check mint
  console.log("Step 1: Checking mint...");
  try {
    const mintInfo = await getMint(conn, new PublicKey(TOKEN_MINT));
    console.log("✅ Mint exists! Supply:", Number(mintInfo.supply) / Math.pow(10, TOKEN_DECIMALS), "TWT");
    console.log("   Authority:", mintInfo.mintAuthority?.toString());
  } catch (e) {
    console.error("❌ Mint check failed:", String(e));
    console.error("   TOKEN_MINT value:", TOKEN_MINT);
    process.exit(1);
  }

  // Step 2: Get platform token account
  console.log("\nStep 2: Getting platform token account...");
  let platformATA;
  try {
    platformATA = await getOrCreateAssociatedTokenAccount(
      conn, platformKp, new PublicKey(TOKEN_MINT), platformKp.publicKey
    );
    const bal = Number(platformATA.amount) / Math.pow(10, TOKEN_DECIMALS);
    console.log("✅ Platform ATA:", platformATA.address.toString());
    console.log("   Balance:", bal, "TWT");
    if (bal < AMOUNT) {
      console.error("❌ Platform has insufficient TWT to airdrop!");
      process.exit(1);
    }
  } catch (e) {
    console.error("❌ Platform ATA failed:", String(e));
    process.exit(1);
  }

  // Step 3: Get recipient token account
  console.log("\nStep 3: Creating/getting recipient token account...");
  let recipientATA;
  try {
    recipientATA = await getOrCreateAssociatedTokenAccount(
      conn, platformKp, new PublicKey(TOKEN_MINT), new PublicKey(RECIPIENT)
    );
    console.log("✅ Recipient ATA:", recipientATA.address.toString());
  } catch (e) {
    console.error("❌ Recipient ATA failed:", String(e));
    process.exit(1);
  }

  // Step 4: Send transfer
  console.log("\nStep 4: Sending", AMOUNT, "TWT on-chain...");
  try {
    const rawAmount = BigInt(Math.round(AMOUNT * Math.pow(10, TOKEN_DECIMALS)));
    const ix = createTransferCheckedInstruction(
      platformATA.address,
      new PublicKey(TOKEN_MINT),
      recipientATA.address,
      platformKp.publicKey,
      rawAmount,
      TOKEN_DECIMALS
    );
    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(conn, tx, [platformKp]);
    
    console.log("\n✅ SUCCESS! TWT sent on-chain!");
    console.log("   TX Signature:", sig);
    console.log("   Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
    console.log("\n📲 Now check Backpack — TWT should be visible!");
    console.log("   If not visible, go to Backpack → Manage hidden tokens → enable TWT");
  } catch (e) {
    console.error("❌ Transfer failed!");
    console.error("   Error:", String(e));
    console.error("   Full:", e);
  }
}

test().catch(e => {
  console.error("Fatal:", String(e));
  process.exit(1);
});
