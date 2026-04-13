import express from "express";
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  commentOnPost,
  deletePost,
  getPostById,
} from "../Controllers/Postcontroller.js"

import { isLoggedIn } from '../Middelwares/Isloggeddin.js';

const router = express.Router();

router.post("/create", isLoggedIn, createPost);
router.get("/feed", isLoggedIn, getFeedPosts);
router.get("/user/:id", isLoggedIn, getUserPosts);
router.put("/like/:postId", isLoggedIn, likePost);
router.post("/comment/:postId", isLoggedIn, commentOnPost);
router.delete("/delete/:postId", isLoggedIn, deletePost);
router.get("/:postId", isLoggedIn, getPostById);

export default router;
