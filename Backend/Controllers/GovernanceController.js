import Proposal from "../Models/Proposal.js";
import User from "../Models/User.js";

// ── List All Proposals (public) ───────────────────────────────────────────────
export const getProposals = async (req, res) => {
  try {
    const { status = "all", limit = 20, skip = 0 } = req.query;
    const filter = status !== "all" ? { status } : {};
    const proposals = await Proposal.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("createdBy", "username profilePic")
      .lean();

    // Summarise vote counts per option instead of returning raw vote docs
    const enriched = proposals.map((p) => {
      const tally = new Array(p.options.length).fill(0);
      let totalWeight = 0;
      p.votes.forEach((v) => {
        tally[v.optionIndex] = (tally[v.optionIndex] || 0) + v.weight;
        totalWeight += v.weight;
      });
      return {
        ...p,
        tally,
        totalVoteWeight: totalWeight,
        voterCount: p.votes.length,
        votes: undefined, // don't expose raw votes
        isPast: new Date(p.endsAt) < new Date(),
      };
    });

    res.json({ success: true, proposals: enriched, count: enriched.length });
  } catch (err) {
    console.error("getProposals error:", err);
    res.status(500).json({ message: "Error fetching proposals" });
  }
};

// ── Create Proposal ──────────────────────────────────────────────────────────
export const createProposal = async (req, res) => {
  try {
    const { title, description, type, options, durationDays = 7 } = req.body;
    const userId = req.user._id;

    if (!title || !description || !options || options.length < 2) {
      return res.status(400).json({ message: "Title, description, and at least 2 options required." });
    }

    // Governance threshold: 10,000 TWT required to create a proposal
    const user = await User.findById(userId).select("twtBalance virtualTwtBalance").lean();
    const balance = (user.twtBalance || 0) + (user.virtualTwtBalance || 0);
    if (balance < 10000) {
      return res.status(403).json({
        message: `You need at least 10,000 TWT to create a proposal. Current balance: ${balance.toFixed(2)} TWT.`,
      });
    }

    const endsAt = new Date(Date.now() + Math.min(Number(durationDays), 14) * 24 * 60 * 60 * 1000);

    const proposal = await Proposal.create({
      title,
      description,
      type: type || "feature",
      options,
      endsAt,
      createdBy: userId,
    });

    res.status(201).json({ success: true, proposal });
  } catch (err) {
    console.error("createProposal error:", err);
    res.status(500).json({ message: "Error creating proposal" });
  }
};

// ── Vote on a Proposal ────────────────────────────────────────────────────────
export const voteOnProposal = async (req, res) => {
  try {
    const { proposalId, optionIndex } = req.body;
    const userId = req.user._id;

    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({ message: "optionIndex is required" });
    }

    const [proposal, user] = await Promise.all([
      Proposal.findById(proposalId),
      User.findById(userId).select("twtBalance virtualTwtBalance").lean(),
    ]);

    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    if (proposal.status !== "active") return res.status(400).json({ message: "Proposal is not active" });
    if (new Date(proposal.endsAt) < new Date()) {
      proposal.status = "failed";
      await proposal.save();
      return res.status(400).json({ message: "Voting period has ended" });
    }
    if (optionIndex >= proposal.options.length) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // 1,000 TWT minimum to vote
    const balance = (user.twtBalance || 0) + (user.virtualTwtBalance || 0);
    if (balance < 1000) {
      return res.status(403).json({ message: "You need at least 1,000 TWT to vote." });
    }

    // Check if user already voted
    const alreadyVoted = proposal.votes.some((v) => v.voter.toString() === userId.toString());
    if (alreadyVoted) {
      return res.status(400).json({ message: "You have already voted on this proposal." });
    }

    proposal.votes.push({ voter: userId, optionIndex, weight: Math.floor(balance) });
    proposal.totalVoteWeight = (proposal.totalVoteWeight || 0) + Math.floor(balance);
    await proposal.save();

    res.json({ success: true, message: "Vote cast successfully!", voterCount: proposal.votes.length });
  } catch (err) {
    console.error("voteOnProposal error:", err);
    res.status(500).json({ message: "Error casting vote" });
  }
};

// ── Get Single Proposal ───────────────────────────────────────────────────────
export const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate("createdBy", "username profilePic")
      .lean();
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    const tally = new Array(proposal.options.length).fill(0);
    let totalWeight = 0;
    proposal.votes.forEach((v) => {
      tally[v.optionIndex] = (tally[v.optionIndex] || 0) + v.weight;
      totalWeight += v.weight;
    });

    // Has requesting user voted?
    let userVote = null;
    if (req.user) {
      const found = proposal.votes.find((v) => v.voter?.toString() === req.user._id.toString());
      if (found) userVote = found.optionIndex;
    }

    res.json({
      success: true,
      proposal: { ...proposal, tally, totalVoteWeight: totalWeight, voterCount: proposal.votes.length, userVote, votes: undefined },
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching proposal" });
  }
};
