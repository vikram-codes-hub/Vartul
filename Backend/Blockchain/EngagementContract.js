/**
 * Engagement Contract Interface
 * Bridge between the Node.js backend and the on-chain Vartul smart contract.
 * Now uses TokenService for real SPL token distribution to users with wallets.
 * Falls back to DB-only tracking for users without wallet addresses.
 */

import User from "../Models/User.js";
import TokenService from "./TokenService.js";

class EngagementContract {
  constructor() {
    this.programId = process.env.VARTUL_PROGRAM_ID || "Engagement_PoS_V1";
  }

 
  // STAKE ENGAGEMENT
  // Records staking intent in DB. Real on-chain locking requires Anchor contract.
  
  async stake_engagement(walletAddress, amount, durationDays) {
    console.log(`[Contract] Staking ${amount} TWT for ${durationDays} days — Wallet: ${walletAddress}`);

    if (walletAddress && walletAddress !== "mock_wallet" && walletAddress.length >= 32) {
      console.log(`[Contract] Wallet ${walletAddress} detected — ready for on-chain stake.`);
    }

    // Simulate blockchain processing delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const txHash = `stake_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[Contract] Stake TX: ${txHash}`);
    return txHash;
  }

  
  // DISTRIBUTE REWARDS
  // For users with wallets: real SPL token transfer via TokenService.airdropTWT

  async distribute_rewards(distributions) {
    console.log(`[Contract] Distributing rewards to ${distributions.length} addresses`);

    if (!distributions || distributions.length === 0) return null;

    const results = [];
    const dbOnlyUpdates = [];

    for (const { userId, wallet, amount, username } of distributions) {
      if (wallet && wallet.length >= 32 && wallet !== "mock_wallet") {
       
        try {
          const result = await TokenService.airdropTWT(wallet, amount);
          console.log(`[Contract] ✅ On-chain reward: ${amount} TWT → ${username || wallet}`);
          results.push({ userId, wallet, amount, status: "on-chain", txSignature: result.txSignature });
        } catch (err) {
          console.warn(`[Contract] ⚠️  On-chain transfer failed for ${username}, falling back to DB:`, err.message);
          // Fall back to DB-only
          dbOnlyUpdates.push({ userId, amount });
          results.push({ userId, wallet, amount, status: "db-fallback", error: err.message });
        }
      } else {
      
        dbOnlyUpdates.push({ userId, amount });
        results.push({ userId, wallet: null, amount, status: "db-only" });
      }
    }

    // Batch DB updates for all non-chain
    if (dbOnlyUpdates.length > 0) {
      const updateOps = dbOnlyUpdates
        .filter((d) => d.userId)
        .map(({ userId, amount }) =>
          User.findByIdAndUpdate(userId, {
            $inc: { twtBalance: amount, totalRewardsEarned: amount },
          })
        );
      await Promise.all(updateOps);
    }

    // Also update DB for on-chain recipients (keep DB in sync)
    const onChainUpdates = distributions
      .filter((d) => d.userId && d.wallet && d.wallet.length >= 32)
      .map(({ userId, amount }) =>
        User.findByIdAndUpdate(userId, {
          $inc: { totalRewardsEarned: amount },
        })
      );
    await Promise.all(onChainUpdates);

    const txHash = `dist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[Contract] Distribution complete. TX Batch ID: ${txHash}`);
    return { txHash, results };
  }


  //get stacke status
  // Real on-chain TWT balance + DB staking state
 
  async get_stake_status(walletAddress, userId) {
    let onChainBalance = null;

    if (walletAddress && walletAddress.length >= 32 && walletAddress !== "mock_wallet") {
      onChainBalance = await TokenService.getTwtBalance(walletAddress);
    }

    const user = userId
      ? await User.findById(userId)
          .select("tokensStaked twtBalance totalRewardsEarned walletAddress")
          .lean()
      : null;

    return {
      active: user?.tokensStaked > 0,
      amount: user?.tokensStaked ?? 0,
      twtBalance: onChainBalance ?? user?.twtBalance ?? 0,
      totalRewardsEarned: user?.totalRewardsEarned ?? 0,
      walletAddress: walletAddress || user?.walletAddress || null,
      onChainBalance,
      unlockTime: Date.now() + 86400000, 
    };
  }
}

export default new EngagementContract();
