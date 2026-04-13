import express from "express";
import { getProposals, createProposal, voteOnProposal, getProposalById } from "../Controllers/GovernanceController.js";
import { isLoggedIn } from "../Middelwares/Isloggeddin.js";

const router = express.Router();

router.get("/proposals", getProposals);                          // Public list
router.get("/proposals/:id", isLoggedIn, getProposalById);      // Single proposal (auth to check userVote)
router.post("/proposals", isLoggedIn, createProposal);          // Create proposal
router.post("/vote", isLoggedIn, voteOnProposal);               // Cast vote

export default router;
