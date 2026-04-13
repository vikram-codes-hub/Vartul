import Engagement from "../Models/Engagement_Model.js";
import User from "../Models/User.js";
import EngagementContract from "../Blockchain/EngagementContract.js";
import TokenService from "../Blockchain/TokenService.js";

// ── Stake TWT for Engagement Rewards ──────────────────────────────────────────
export const stakeEngagement = async (req, res) => {
  try {
    const { amount, durationDays } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid stake amount" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const walletAddress = user.walletAddress || "mock_wallet";

    const txHash = await EngagementContract.stake_engagement(walletAddress, amount, durationDays);

    let engagement = await Engagement.findOne({ user: userId });
    if (!engagement) {
      engagement = new Engagement({ user: userId });
    }

    engagement.stakeAmount = amount;
    engagement.lockDurationDays = durationDays || 1;
    engagement.stakeStartTime = new Date();
    engagement.status = "active";
    engagement.accumulatedWatchTimeMs = 0;

    await engagement.save();
    await User.findByIdAndUpdate(userId, { tokensStaked: amount });

    res.status(200).json({
      success: true,
      message: "Engagement stake active",
      txHash,
      engagement,
    });
  } catch (error) {
    console.error("Stake Error:", error);
    res.status(500).json({ message: "Server error during staking" });
  }
};

// ── Log Watch Time ─────────────────────────────────────────────────────────────
export const logWatchTime = async (req, res) => {
  try {
    const { watchTimeMs, watchPercentage } = req.body;
    const userId = req.user._id;

    if (watchPercentage < 60) {
      return res.status(200).json({ message: "Watch time ignored (<60%)" });
    }

    if (watchPercentage > 90) {
      console.warn(`[Anti-Bot] User ${userId} watch% > 90 — flagged for verification`);
    }

    const engagement = await Engagement.findOne({ user: userId });
    if (!engagement || engagement.status !== "active") {
      return res.status(400).json({ message: "No active engagement stake. Stake TWT to earn rewards." });
    }

    engagement.accumulatedWatchTimeMs += watchTimeMs;
    engagement.validWatchPercentageAvg =
      (engagement.validWatchPercentageAvg + watchPercentage) / 2;

    await engagement.save();

    res.status(200).json({ success: true, accumulated: engagement.accumulatedWatchTimeMs });
  } catch (error) {
    console.error("Watch Log Error:", error);
    res.status(500).json({ message: "Server error logging watch time" });
  }
};

// ── Calculate & Distribute Daily Rewards ──────────────────────────────────────
export const calculateRewards = async (req, res) => {
  try {
    const V_RESERVE = 1_000_000;
    const R_DAILY_RATE = 0.15;
    const ALPHA = 0.50;

    const R_total = V_RESERVE * R_DAILY_RATE;
    const R_users = R_total * ALPHA;

    const activeEngagements = await Engagement.find({ status: "active" }).populate("user", "walletAddress username");
    if (!activeEngagements.length) {
      return res.status(200).json({ message: "No active stakes" });
    }

    const S_total = activeEngagements.reduce((sum, e) => sum + e.stakeAmount, 0);
    if (S_total === 0) return res.status(200).json({ message: "No staked tokens" });

    const distributions = [];

    for (const eng of activeEngagements) {
      const Su = eng.stakeAmount;
      const WatchPct = Math.min(eng.validWatchPercentageAvg || 0, 100);

      const now = new Date();
      const diffMs = Math.abs(now - (eng.stakeStartTime || now));
      const T = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const timeMultiplier = 1 + 0.05 * Math.log(T);
      let R_user = R_users * (Su / S_total) * (WatchPct / 100) * timeMultiplier;
      R_user = Math.round(R_user * 10000) / 10000;

      if (R_user > 0) {
        eng.totalRewardsEarned = (eng.totalRewardsEarned || 0) + R_user;
        eng.accumulatedWatchTimeMs = 0;
        eng.validWatchPercentageAvg = 0;
        eng.lastRewardCalculation = new Date();
        await eng.save();

        distributions.push({
          userId: eng.user?._id,
          wallet: eng.user?.walletAddress || null,
          amount: R_user,
          username: eng.user?.username,
        });
      }
    }

    if (distributions.length > 0) {
      const result = await EngagementContract.distribute_rewards(distributions);
      return res.status(200).json({
        success: true,
        message: `Rewards distributed to ${distributions.length} users`,
        totalDistributed: distributions.reduce((s, d) => s + d.amount, 0).toFixed(4),
        txHash: result?.txHash,
        results: result?.results,
        distributions,
      });
    }

    res.status(200).json({ message: "No rewards to distribute this epoch" });
  } catch (error) {
    console.error("Reward Calc Error:", error);
    res.status(500).json({ message: "Server error calculating rewards" });
  }
};

// ── Get Engagement Status for Current User ────────────────────────────────────
export const getEngagementStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const engagement = await Engagement.findOne({ user: userId });
    const user = await User.findById(userId)
      .select("twtBalance totalRewardsEarned tokensStaked walletAddress")
      .lean();

    if (!engagement) {
      return res.json({
        status: "inactive",
        stakeAmount: 0,
        twtBalance: user?.twtBalance || 0,
        totalRewardsEarned: user?.totalRewardsEarned || 0,
        walletAddress: user?.walletAddress || null,
      });
    }

    res.json({
      ...engagement.toObject(),
      twtBalance: user?.twtBalance || 0,
      totalRewardsEarned: user?.totalRewardsEarned || 0,
      walletAddress: user?.walletAddress || null,
    });
  } catch (error) {
    console.error("Status Error:", error);
    res.status(500).json({ message: "Error fetching engagement status" });
  }
};

// ── Get Dashboard Stats for Current User ─────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, engagement] = await Promise.all([
      User.findById(userId)
        .select("twtBalance totalRewardsEarned tokensStaked walletAddress username profilePic followersCount followingCount postsCount")
        .lean(),
      Engagement.findOne({ user: userId }).lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    let daysStaked = 0;
    if (engagement?.stakeStartTime) {
      const diffMs = Date.now() - new Date(engagement.stakeStartTime).getTime();
      daysStaked = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Try to get real on-chain balance if wallet exists
    let onChainBalance = null;
    if (user.walletAddress && user.walletAddress.length >= 32) {
      try {
        onChainBalance = await TokenService.getTwtBalance(user.walletAddress);
      } catch {
        // fallback to DB balance
      }
    }

    const liveBalance = onChainBalance !== null ? onChainBalance : (user.twtBalance || 0);

    res.json({
      success: true,
      wallet: {
        address: user.walletAddress || null,
        total: liveBalance,
        staked: user.tokensStaked || 0,
        available: Math.max(0, liveBalance - (user.tokensStaked || 0)),
        onChain: onChainBalance !== null,
      },
      engagement: {
        status: engagement?.status || "inactive",
        stakeAmount: engagement?.stakeAmount || 0,
        daysStaked,
        totalRewardsEarned: user.totalRewardsEarned || 0,
        earnedTWT: engagement?.totalRewardsEarned || 0,
        lastRewardCalculation: engagement?.lastRewardCalculation || null,
        accumulatedWatchTimeMs: engagement?.accumulatedWatchTimeMs || 0,
      },
      social: {
        followers: user.followersCount || 0,
        following: user.followingCount || 0,
        posts: user.postsCount || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

// ── Get Token Info (Mint, Supply, Explorer) ───────────────────────────────────
export const getTokenInfo = async (req, res) => {
  try {
    const mintInfo = await TokenService.getMintInfo();
    const networkInfo = await TokenService.getNetworkInfo();
    res.json({
      success: true,
      token: {
        name: "Vartul Token",
        symbol: "TWT",
        ...mintInfo,
      },
      network: networkInfo,
    });
  } catch (error) {
    console.error("Token Info Error:", error);
    res.status(500).json({ message: "Error fetching token info" });
  }
};

// ── Get Live On-Chain Token Balance for Auth User ─────────────────────────────
export const getTokenBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("walletAddress twtBalance").lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.walletAddress || user.walletAddress.length < 32) {
      return res.json({
        success: true,
        balance: user.twtBalance || 0,
        onChain: false,
        walletAddress: null,
        message: "No wallet address linked. Connect your wallet to see on-chain balance.",
      });
    }

    const onChainBalance = await TokenService.getTwtBalance(user.walletAddress);
    const solBalance = await TokenService.getSolBalance(user.walletAddress);

    res.json({
      success: true,
      balance: onChainBalance,
      solBalance,
      onChain: true,
      walletAddress: user.walletAddress,
      explorerUrl: `https://explorer.solana.com/address/${user.walletAddress}?cluster=${TokenService.NETWORK}`,
    });
  } catch (error) {
    console.error("Token Balance Error:", error);
    res.status(500).json({ message: "Error fetching token balance" });
  }
};

// ── Get Wallet Transactions from Solana Devnet ────────────────────────────────
export const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 15;
    const user = await User.findById(userId).select("walletAddress").lean();

    if (!user?.walletAddress || user.walletAddress.length < 32) {
      return res.json({
        success: true,
        transactions: [],
        message: "No wallet linked",
      });
    }

    const transactions = await TokenService.getWalletTransactions(user.walletAddress, limit);

    res.json({
      success: true,
      walletAddress: user.walletAddress,
      transactions,
      explorerUrl: `https://explorer.solana.com/address/${user.walletAddress}?cluster=${TokenService.NETWORK}`,
    });
  } catch (error) {
    console.error("Wallet Transactions Error:", error);
    res.status(500).json({ message: "Error fetching wallet transactions" });
  }
};

// ── Airdrop TWT (Admin / Devnet Testing) ─────────────────────────────────────
export const airdropTokens = async (req, res) => {
  try {
    const { walletAddress, amount = 100 } = req.body;
    const userId = req.user._id;

    // Use provided wallet or user's linked wallet
    let targetWallet = walletAddress;
    if (!targetWallet) {
      const user = await User.findById(userId).select("walletAddress").lean();
      targetWallet = user?.walletAddress;
    }

    if (!targetWallet || targetWallet.length < 32) {
      return res.status(400).json({
        message: "No valid wallet address. Link a wallet to your profile first.",
      });
    }

    const result = await TokenService.airdropTWT(targetWallet, amount);

    // Update DB balance to reflect the airdrop
    await User.findByIdAndUpdate(userId, {
      $inc: { twtBalance: amount },
    });

    res.json({
      success: true,
      message: `Successfully airdropped ${amount} TWT`,
      ...result,
    });
  } catch (error) {
    console.error("Airdrop Error:", error);
    res.status(500).json({
      message: error.message || "Airdrop failed. Check platform wallet balance.",
    });
  }
};

import Tip from "../Models/Tip.js";
import CreatorStake from "../Models/CreatorStake.js";
import TransactionLog from "../Models/TransactionLog.js";

// ── Claim Initial Virtual Token Grant (IVTG) ──────────────────────────────────
export const claimIVTG = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("ivtgClaimed virtualTwtBalance username");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.ivtgClaimed) {
      return res.status(400).json({ message: "Initial Token Grant already claimed." });
    }
    const IVTG_AMOUNT = 100;
    user.ivtgClaimed = true;
    user.virtualTwtBalance = (user.virtualTwtBalance || 0) + IVTG_AMOUNT;
    await user.save();
    res.json({
      success: true,
      message: `🎉 ${IVTG_AMOUNT} virtual TWT credited to your account!`,
      virtualTwtBalance: user.virtualTwtBalance,
      note: "Virtual TWT becomes real after 14 days of activity and 3+ watch sessions.",
    });
  } catch (err) {
    console.error("IVTG Claim Error:", err);
    res.status(500).json({ message: "Error claiming IVTG" });
  }
};

// ── W2E Watch Heartbeat (called every 5s of verified watch time) ──────────────
export const watchHeartbeat = async (req, res) => {
  try {
    const {
      videoId,
      watchTimeMs = 5000,
      // Optional session signals for bot detection
      scrollSpeed       = 1.5,
      skipTime          = 5,
      watchPercentage   = 60,
      sessionDuration   = 600,
      videosPerSession  = 6,
    } = req.body;

    const userId = req.user._id;
    if (!videoId) return res.status(400).json({ message: "videoId required" });
    if (watchTimeMs < 4000) return res.status(429).json({ message: "Heartbeat too frequent" });

    const user = await User.findById(userId).select(
      "watchSessionCount twtBalance virtualTwtBalance ivtgClaimed isVirtualConverted createdAt"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const stake = await Engagement.findOne({ user: userId, status: "active" }).select("stakeAmount");

    // ── ML Bot Detection ───────────────────────────────────────────────────────
    const { callML } = await import("../Utils/mlService.js");
    const mlResult = await callML({
      scroll_speed:       scrollSpeed,
      skip_time:          skipTime,
      watch_percentage:   watchPercentage,
      session_duration:   sessionDuration,
      videos_per_session: videosPerSession,
      watch_time:         Math.round(watchTimeMs / 1000),
      likes:              0,
      shares:             0,
      comments:           0,
      stake_amount:       stake?.stakeAmount || 0,
      // feed/engagement fields (not used for bot detection but required by /predict)
      creator_reputation: 0.5,
      creator_followers:  100,
      views:              0,
    });

    const botResult = mlResult?.bot;

    // NOTE: Frontend sends estimated/hardcoded signals (scroll_speed, skipTime, likes=0)
    // so we apply stricter thresholds here to avoid false-positive bot flags.
    // ML model threshold: 0.4 → remove_rewards, 0.7 → slash_stake
    // Our effective threshold: 0.6 → remove_rewards, 0.8 → slash_stake
    const botProb = botResult?.bot_probability ?? 0;
    const effectiveAction = botProb >= 0.8 ? "slash_stake"
                          : botProb >= 0.6 ? "remove_rewards"
                          : "allow";

    // Act on bot detection result
    if (effectiveAction === "slash_stake") {
      // Suspend the engagement stake
      await Engagement.findOneAndUpdate(
        { user: userId, status: "active" },
        { status: "suspended" }
      );
      console.warn(`[BotDetection] 🚨 Stake suspended for user ${userId} — prob: ${botResult.bot_probability}`);
      return res.status(200).json({
        success: false,
        earned: 0,
        twtBalance: user.twtBalance,
        virtualTwtBalance: user.virtualTwtBalance,
        isVirtualConverted: user.isVirtualConverted,
        botWarning: true,
        botAction: "slash_stake",
        botProbability: botResult.bot_probability,
        trustScore: botResult.trust_score,
        message: "⚠️ Suspicious activity detected. Your stake has been suspended.",
      });
    }

    if (effectiveAction === "remove_rewards") {
      console.warn(`[BotDetection] ⚠️ Rewards withheld for user ${userId} — prob: ${botResult.bot_probability}`);
      return res.status(200).json({
        success: false,
        earned: 0,
        twtBalance: user.twtBalance,
        virtualTwtBalance: user.virtualTwtBalance,
        isVirtualConverted: user.isVirtualConverted,
        botWarning: true,
        botAction: "remove_rewards",
        botProbability: botResult.bot_probability,
        trustScore: botResult.trust_score,
        message: "⚠️ Suspicious activity detected. Rewards paused for this session.",
      });
    }
    // ── End Bot Detection ──────────────────────────────────────────────────────

    user.watchSessionCount = (user.watchSessionCount || 0) + 1;
    const BASE_RATE_PER_5S = 0.5 / 12;
    let multiplier = 1.0;
    if (stake?.stakeAmount >= 500) multiplier = 1.5;
    else if (stake?.stakeAmount >= 100) multiplier = 1.25;
    const earned = Math.round(BASE_RATE_PER_5S * multiplier * 10000) / 10000;

    if (user.isVirtualConverted) {
      user.twtBalance = (user.twtBalance || 0) + earned;
    } else {
      user.virtualTwtBalance = (user.virtualTwtBalance || 0) + earned;
    }

    // IVTG Graduation check: 14+ days old AND 3+ sessions
    if (!user.isVirtualConverted && user.ivtgClaimed) {
      const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeDays >= 14 && user.watchSessionCount >= 3) {
        user.twtBalance = (user.twtBalance || 0) + (user.virtualTwtBalance || 0);
        user.virtualTwtBalance = 0;
        user.isVirtualConverted = true;
      }
    }
    await user.save();

    res.json({
      success: true,
      earned,
      twtBalance: user.twtBalance,
      virtualTwtBalance: user.virtualTwtBalance,
      isVirtualConverted: user.isVirtualConverted,
      botWarning: false,
      botAction: "allow",
      botProbability: botResult?.bot_probability ?? 0,
      trustScore: botResult?.trust_score ?? 100,
    });
  } catch (err) {
    console.error("Heartbeat Error:", err);
    res.status(500).json({ message: "Error processing heartbeat" });
  }
};

// ── Send Tip to Creator ───────────────────────────────────────────────────────
export const sendTip = async (req, res) => {
  try {
    const { toUserId, amount, message = "" } = req.body;
    const fromUserId = req.user._id;
    if (!toUserId || !amount) return res.status(400).json({ message: "toUserId and amount required" });
    if (amount < 0.1) return res.status(400).json({ message: "Minimum tip is 0.1 TWT" });
    if (toUserId === fromUserId.toString()) return res.status(400).json({ message: "Cannot tip yourself" });

    const [sender, recipient] = await Promise.all([
      User.findById(fromUserId).select("twtBalance virtualTwtBalance"),
      User.findById(toUserId).select("twtBalance username"),
    ]);
    if (!sender || !recipient) return res.status(404).json({ message: "User not found" });

    const senderBalance = (sender.twtBalance || 0) + (sender.virtualTwtBalance || 0);
    if (senderBalance < amount) return res.status(400).json({ message: `Insufficient TWT balance. You have ${senderBalance.toFixed(4)} TWT.` });

    const tipType = amount >= 10 ? "super" : "micro";
    const fee = Math.round(amount * 0.05 * 10000) / 10000;
    const creatorReceived = amount - fee;

    if ((sender.twtBalance || 0) >= amount) {
      sender.twtBalance -= amount;
    } else {
      const remaining = amount - (sender.twtBalance || 0);
      sender.twtBalance = 0;
      sender.virtualTwtBalance = Math.max(0, (sender.virtualTwtBalance || 0) - remaining);
    }
    recipient.twtBalance = (recipient.twtBalance || 0) + creatorReceived;

    await Promise.all([sender.save(), recipient.save(), Tip.create({ from: fromUserId, to: toUserId, amount, type: tipType, message })]);

    res.json({ success: true, message: `${tipType === "super" ? "🌟 Super tip" : "💸 Tip"} of ${amount} TWT sent to @${recipient.username}!`, tipType, amount, creatorReceived, platformFee: fee });
  } catch (err) {
    console.error("Tip Error:", err);
    res.status(500).json({ message: "Error sending tip" });
  }
};

// ── Get Tip History ───────────────────────────────────────────────────────────
export const getTipHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { direction = "both", limit = 20 } = req.query;
    let filter = {};
    if (direction === "sent") filter = { from: userId };
    else if (direction === "received") filter = { to: userId };
    else filter = { $or: [{ from: userId }, { to: userId }] };

    const tips = await Tip.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("from", "username profilePic")
      .populate("to", "username profilePic")
      .lean();

    res.json({ success: true, tips });
  } catch (err) {
    res.status(500).json({ message: "Error fetching tip history" });
  }
};

// ── Stake TWT on a Creator ────────────────────────────────────────────────────
export const stakeOnCreator = async (req, res) => {
  try {
    const { creatorId, amount, lockDays = 7 } = req.body;
    const stakerId = req.user._id;
    if (!creatorId || !amount || amount < 1) return res.status(400).json({ message: "creatorId and amount (min 1 TWT) required" });
    if (![7, 30, 90].includes(Number(lockDays))) return res.status(400).json({ message: "lockDays must be 7, 30, or 90" });
    if (creatorId === stakerId.toString()) return res.status(400).json({ message: "Cannot stake on yourself" });

    const [staker, creator] = await Promise.all([
      User.findById(stakerId).select("twtBalance virtualTwtBalance"),
      User.findById(creatorId).select("username"),
    ]);
    if (!staker || !creator) return res.status(404).json({ message: "User not found" });

    const totalBalance = (staker.twtBalance || 0) + (staker.virtualTwtBalance || 0);
    if (totalBalance < amount) return res.status(400).json({ message: `Insufficient balance. You have ${totalBalance.toFixed(4)} TWT.` });

    if ((staker.twtBalance || 0) >= amount) {
      staker.twtBalance -= amount;
    } else {
      const rem = amount - (staker.twtBalance || 0);
      staker.twtBalance = 0;
      staker.virtualTwtBalance = Math.max(0, (staker.virtualTwtBalance || 0) - rem);
    }

    const unlockDate = new Date(Date.now() + Number(lockDays) * 24 * 60 * 60 * 1000);
    const [newStake] = await Promise.all([
      CreatorStake.create({ staker: stakerId, creator: creatorId, amount, lockDays, unlockDate, pstTokens: amount, isActive: true }),
      staker.save(),
    ]);

    res.status(201).json({ success: true, message: `Staked ${amount} TWT on @${creator.username} for ${lockDays} days!`, stake: newStake, unlockDate });
  } catch (err) {
    console.error("Creator Stake Error:", err);
    res.status(500).json({ message: "Error staking on creator" });
  }
};

// ── Get My Creator Stakes ─────────────────────────────────────────────────────
export const getCreatorStakes = async (req, res) => {
  try {
    const userId = req.user._id;
    const stakes = await CreatorStake.find({ staker: userId, isActive: true })
      .populate("creator", "username profilePic bio followersCount")
      .sort({ createdAt: -1 })
      .lean();

    const enriched = stakes.map((s) => ({
      ...s,
      isUnlocked: new Date(s.unlockDate) <= new Date(),
      daysLeft: Math.max(0, Math.ceil((new Date(s.unlockDate) - Date.now()) / (1000 * 60 * 60 * 24))),
    }));

    res.json({ success: true, stakes: enriched });
  } catch (err) {
    res.status(500).json({ message: "Error fetching creator stakes" });
  }
};

// ── Unstake Engagement Tokens ─────────────────────────────────────────────────
export const unstakeEngagement = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    const [engagement, user] = await Promise.all([
      Engagement.findOne({ user: userId }),
      User.findById(userId).select("tokensStaked twtBalance"),
    ]);

    if (!engagement || engagement.status !== "active") {
      return res.status(400).json({ message: "No active stake to unstake" });
    }

    const unstakeAmount = amount ? Math.min(Number(amount), engagement.stakeAmount) : engagement.stakeAmount;
    const remaining = engagement.stakeAmount - unstakeAmount;

    engagement.stakeAmount = remaining;
    if (remaining <= 0) {
      engagement.status = "inactive";
      engagement.stakeAmount = 0;
    }
    await engagement.save();

    const newStaked = Math.max(0, (user.tokensStaked || 0) - unstakeAmount);
    await User.findByIdAndUpdate(userId, {
      tokensStaked: newStaked,
      $inc: { twtBalance: unstakeAmount },
    });

    // Log the transaction
    await TransactionLog.create({
      user: userId,
      type: "unstake",
      amount: unstakeAmount,
      status: "confirmed",
      note: remaining <= 0 ? "Full unstake" : `Partial unstake — ${remaining} TWT still staked`,
    });

    res.json({
      success: true,
      message: `Successfully unstaked ${unstakeAmount} TWT`,
      unstakedAmount: unstakeAmount,
      remainingStake: remaining,
      newStatus: remaining <= 0 ? "inactive" : "active",
    });
  } catch (err) {
    console.error("Unstake Error:", err);
    res.status(500).json({ message: "Error unstaking tokens" });
  }
};

// ── Get Reward History ────────────────────────────────────────────────────────
export const getRewardHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    // Combine tx logs + tip history
    const [txLogs, tipHistory] = await Promise.all([
      TransactionLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("relatedUser", "username profilePic")
        .lean(),
      Tip.find({ $or: [{ from: userId }, { to: userId }] })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("from", "username profilePic")
        .populate("to", "username profilePic")
        .lean(),
    ]);

    const engagement = await Engagement.findOne({ user: userId }).lean();

    res.json({
      success: true,
      totalEarned: engagement?.totalRewardsEarned || 0,
      txLogs,
      tipHistory,
    });
  } catch (err) {
    console.error("Reward History Error:", err);
    res.status(500).json({ message: "Error fetching reward history" });
  }
};

// ── Get Creator Earnings ──────────────────────────────────────────────────────
export const getCreatorEarnings = async (req, res) => {
  try {
    const userId = req.user._id;

    const [tipsReceived, creatorStakesOnMe, engagement, user] = await Promise.all([
      Tip.find({ to: userId }).sort({ createdAt: -1 }).limit(20)
        .populate("from", "username profilePic")
        .lean(),
      CreatorStake.find({ creator: userId, isActive: true })
        .populate("staker", "username profilePic")
        .lean(),
      Engagement.findOne({ user: userId }).lean(),
      User.findById(userId).select("twtBalance totalRewardsEarned tokensStaked").lean(),
    ]);

    const totalTipsReceived = tipsReceived.reduce((s, t) => s + t.amount, 0);
    const totalStakedOnMe = creatorStakesOnMe.reduce((s, c) => s + c.amount, 0);
    const watchRewards = engagement?.totalRewardsEarned || 0;
    const totalEarnings = totalTipsReceived + watchRewards;

    // Earnings breakdown by source
    const earningsSources = [
      { source: "Watch Rewards", amount: watchRewards },
      { source: "Tips Received", amount: totalTipsReceived },
      { source: "Creator Stakes", amount: totalStakedOnMe },
    ];

    // Performance metrics
    const metrics = {
      watchSessions: user ? (user.watchSessionCount || 0) : 0,
      engagementStatus: engagement?.status || "inactive",
      daysActive: engagement?.stakeStartTime
        ? Math.floor((Date.now() - new Date(engagement.stakeStartTime).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      avgWatchPct: Math.round(engagement?.validWatchPercentageAvg || 0),
    };

    res.json({
      success: true,
      totalEarnings,
      totalTipsReceived,
      totalStakedOnMe,
      watchRewards,
      earningsSources,
      tipsReceived: tipsReceived.slice(0, 10),
      topSupporters: creatorStakesOnMe.slice(0, 5),
      metrics,
    });
  } catch (err) {
    console.error("Creator Earnings Error:", err);
    res.status(500).json({ message: "Error fetching creator earnings" });
  }
};

// ── Internal Token Transfer (DB-level) ───────────────────────────────────────
export const transferTokens = async (req, res) => {
  try {
    const { toUserId, amount, note = "" } = req.body;
    const fromUserId = req.user._id;

    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({ message: "toUserId and positive amount required" });
    }
    if (toUserId === fromUserId.toString()) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(fromUserId).select("twtBalance virtualTwtBalance"),
      User.findById(toUserId).select("username twtBalance"),
    ]);
    if (!sender || !recipient) return res.status(404).json({ message: "User not found" });

    const totalBalance = (sender.twtBalance || 0) + (sender.virtualTwtBalance || 0);
    if (totalBalance < amount) {
      return res.status(400).json({
        message: `Insufficient balance. You have ${totalBalance.toFixed(4)} TWT`,
      });
    }

    // Deduct from sender
    if ((sender.twtBalance || 0) >= amount) {
      sender.twtBalance -= amount;
    } else {
      const rem = amount - (sender.twtBalance || 0);
      sender.twtBalance = 0;
      sender.virtualTwtBalance = Math.max(0, (sender.virtualTwtBalance || 0) - rem);
    }
    recipient.twtBalance = (recipient.twtBalance || 0) + amount;

    await Promise.all([sender.save(), recipient.save()]);

    // Log both sides
    await Promise.all([
      TransactionLog.create({ user: fromUserId, type: "transfer", amount: -amount, relatedUser: toUserId, status: "confirmed", note }),
      TransactionLog.create({ user: toUserId, type: "transfer", amount, relatedUser: fromUserId, status: "confirmed", note }),
    ]);

    res.json({
      success: true,
      message: `Transferred ${amount} TWT to @${recipient.username}`,
      amount,
      recipient: { username: recipient.username, id: toUserId },
    });
  } catch (err) {
    console.error("Transfer Error:", err);
    res.status(500).json({ message: "Error transferring tokens" });
  }
};

// ── Get Internal Transaction Logs ─────────────────────────────────────────────
export const getTransactionLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 30;
    const type = req.query.type; // filter by type

    const filter = { user: userId };
    if (type) filter.type = type;

    const logs = await TransactionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("relatedUser", "username profilePic")
      .lean();

    res.json({ success: true, logs, count: logs.length });
  } catch (err) {
    console.error("Transaction Logs Error:", err);
    res.status(500).json({ message: "Error fetching transaction logs" });
  }
};
