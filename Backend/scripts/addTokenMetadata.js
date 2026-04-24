/**
 * addTokenMetadata.js — Add name/symbol/logo to TWT token on devnet
 * Uses @metaplex-foundation/mpl-token-metadata@2.13.0 (legacy API)
 * 
 * First run: npm install @metaplex-foundation/mpl-token-metadata@2.13.0
 * Then run:  node scripts/addTokenMetadata.js
 */
import dotenv from "dotenv";
dotenv.config();

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

// Hardcoded token metadata program ID
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const RPC_URL  = process.env.SOLANA_RPC || clusterApiUrl("devnet");
const TOKEN_MINT = process.env.TOKEN_MINT;

if (!TOKEN_MINT) { console.error("TOKEN_MINT not set in .env"); process.exit(1); }

const conn = new Connection(RPC_URL, "confirmed");
const rawKey = JSON.parse(process.env.PLATFORM_PRIVATE_KEY);
const platformKp = Keypair.fromSecretKey(Uint8Array.from(rawKey));
const mintPubKey = new PublicKey(TOKEN_MINT);

const TOKEN_NAME   = "Vartul Watch Token";
const TOKEN_SYMBOL = "TWT";
const TOKEN_URI    = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

console.log("=".repeat(60));
console.log("🎨 Adding TWT Token Metadata");
console.log("=".repeat(60));
console.log("Mint    :", TOKEN_MINT);
console.log("Name    :", TOKEN_NAME);
console.log("Symbol  :", TOKEN_SYMBOL);
console.log("=".repeat(60) + "\n");

// Derive metadata PDA
function getMetadataPDA(mint) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID
  );
  return pda;
}

// Build CreateMetadataAccountV3 instruction manually
// Instruction index 33 = CreateMetadataAccountV3
function buildMetadataIx(metadataPDA, mint, mintAuthority, payer) {
  const nameBytes   = Buffer.from(TOKEN_NAME,   "utf8");
  const symbolBytes = Buffer.from(TOKEN_SYMBOL, "utf8");
  const uriBytes    = Buffer.from(TOKEN_URI,    "utf8");

  const dataLen =
    1 +                        // instruction index
    4 + nameBytes.length +     // name (u32 len prefix + bytes)
    4 + symbolBytes.length +   // symbol
    4 + uriBytes.length +      // uri
    2 +                        // sellerFeeBasisPoints (u16)
    1 +                        // creators: None (0x00)
    1 +                        // collection: None (0x00)
    1 +                        // uses: None (0x00)
    1 +                        // is_mutable: true (0x01)
    1;                         // collectionDetails: None (0x00)

  const data = Buffer.alloc(dataLen);
  let o = 0;

  data.writeUInt8(33, o);          o += 1; // CreateMetadataAccountV3

  data.writeUInt32LE(nameBytes.length, o);   o += 4;
  nameBytes.copy(data, o);                   o += nameBytes.length;

  data.writeUInt32LE(symbolBytes.length, o); o += 4;
  symbolBytes.copy(data, o);                 o += symbolBytes.length;

  data.writeUInt32LE(uriBytes.length, o);    o += 4;
  uriBytes.copy(data, o);                    o += uriBytes.length;

  data.writeUInt16LE(0, o);        o += 2; // sellerFeeBasisPoints = 0
  data.writeUInt8(0, o);           o += 1; // creators = None
  data.writeUInt8(0, o);           o += 1; // collection = None
  data.writeUInt8(0, o);           o += 1; // uses = None
  data.writeUInt8(1, o);           o += 1; // is_mutable = true
  data.writeUInt8(0, o);           o += 1; // collectionDetails = None

  return new TransactionInstruction({
    programId: METADATA_PROGRAM_ID,
    keys: [
      { pubkey: metadataPDA,              isSigner: false, isWritable: true  },
      { pubkey: mint,                     isSigner: false, isWritable: false },
      { pubkey: mintAuthority,            isSigner: true,  isWritable: false },
      { pubkey: payer,                    isSigner: true,  isWritable: true  },
      { pubkey: mintAuthority,            isSigner: false, isWritable: false }, // update authority
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data,
  });
}

async function main() {
  const metadataPDA = getMetadataPDA(mintPubKey);
  console.log("Metadata PDA:", metadataPDA.toString());

  // Check if metadata already exists
  const existing = await conn.getAccountInfo(metadataPDA);
  if (existing && existing.data.length > 0) {
    console.log("\n✅ Metadata account already exists on-chain!");
    console.log("   Refresh Backpack to see 'TWT' token name.");
    return;
  }

  const ix = buildMetadataIx(metadataPDA, mintPubKey, platformKp.publicKey, platformKp.publicKey);
  const tx = new Transaction().add(ix);

  console.log("\nSending metadata transaction to devnet...");
  try {
    const sig = await sendAndConfirmTransaction(conn, tx, [platformKp], { commitment: "confirmed" });
    console.log("\n✅ Metadata added successfully!");
    console.log("   TX:", sig);
    console.log("   Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
    console.log("\n📲 Now refresh Backpack — token shows as 'TWT' (Vartul Watch Token)!");
  } catch (e) {
    console.error("❌ Failed:", String(e));
  }
}

main().catch(console.error);
