import express from "express";
import {
  uploadStory,
  getStoriesFeed,
  getMyStories,
  getUserStories,
  viewStory,
  getStoryViewers,
  deleteStory
} from "../Controllers/StoryController.js";

import { isLoggedIn } from "../Middelwares/Isloggeddin.js";
import upload from "../Middelwares/upload.js";

const storyRouter = express.Router();

/* =========================
   CREATE / UPLOAD STORY
========================= */
storyRouter.post(
  "/upload",
 isLoggedIn,
  upload.single("file"),
  uploadStory
);

/* =========================
   STORIES FEED (Home page)
   - own + following stories
========================= */
storyRouter.get(
  "/feed",
  isLoggedIn,
  getStoriesFeed
);

/* =========================
   GET MY STORIES
========================= */
storyRouter.get(
  "/me",
  isLoggedIn,
  getMyStories
);

/* =========================
   GET USER STORIES
========================= */
storyRouter.get(
  "/user/:userId",
  isLoggedIn,
  getUserStories
);

/* =========================
   VIEW STORY
========================= */
storyRouter.post(
  "/view/:storyId",
  isLoggedIn,
  viewStory
);

/* =========================
   STORY VIEWERS (owner only)
========================= */
storyRouter.get(
  "/viewers/:storyId",
  isLoggedIn,
  getStoryViewers
);

/* =========================
   DELETE STORY
========================= */
storyRouter.delete(
  "/:storyId",
  isLoggedIn,
  deleteStory
);

export default storyRouter;
