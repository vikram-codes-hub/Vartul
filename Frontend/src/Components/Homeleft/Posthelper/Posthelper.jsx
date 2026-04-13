import React, { useState, useContext, useRef, useCallback } from "react";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  SmilePlus
} from "lucide-react";
import { usePost } from "../../../context/PostContext";
import { Usercontext } from "../../../context/Usercontext";
import PostOptionsModal from "./PostoptionsModel";
import { useNavigate } from "react-router-dom";

/* ── helpers ───────────────────────────────────────────────────────────── */
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
};

/* ── Post Card ──────────────────────────────────────────────────────────── */
const Posthelper = ({ post }) => {
  const { toggleLike, commentOnPost } = usePost();
  const { user } = useContext(Usercontext);
  const navigate = useNavigate();

  const postUser = post.userId;
  const currentUserId = user?._id;
  const isLikedInit = Array.isArray(post.likes) && post.likes.includes(currentUserId);

  const [isLiked, setIsLiked] = useState(isLikedInit);
  const [likesCount, setLikesCount] = useState(post.likes?.length ?? 0);
  const [saved, setSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const commentInput = useRef(null);
  const doubleTapTimer = useRef(null);
  const lastTap = useRef(0);

  /* ── Like ──────────────────────────────────────────────────────────── */
  const handleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    toggleLike(post._id);
  }, [isLiked, post._id, toggleLike]);

  /* Double-tap to like (touch-friendly & mouse-friendly) */
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      clearTimeout(doubleTapTimer.current);
      if (!isLiked) {
        handleLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTap.current = now;
  };

  /* ── Comment submit ────────────────────────────────────────────────── */
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    await commentOnPost(post._id, commentText);
    setCommentText("");
    setSubmitting(false);
    setShowComments(true);
  };

  const avatar = (src, name) =>
    src ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=6d28d9&color=fff`;

  const caption =
    post.caption && post.caption.length > 120 && !showFullCaption
      ? post.caption.slice(0, 120) + "…"
      : post.caption;

  return (
    <article className="w-full bg-[#0a0a0a] border border-white/8 rounded-2xl overflow-hidden shadow-lg hover:border-white/15 transition-colors duration-300">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(`/profile/${postUser?._id}`)}
          className="flex items-center gap-3 group"
        >
          {/* Avatar with gradient ring */}
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex-shrink-0">
            <div className="w-full h-full rounded-full p-[2px] bg-[#0a0a0a]">
              <img
                src={avatar(postUser?.profilePic, postUser?.username)}
                className="w-full h-full rounded-full object-cover"
                alt={postUser?.username}
                onError={(e) => { e.target.src = avatar(null, postUser?.username); }}
              />
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
              {postUser?.username}
            </p>
            {post.createdAt && (
              <p className="text-[11px] text-gray-500">{timeAgo(post.createdAt)}</p>
            )}
          </div>
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* ── MEDIA ─────────────────────────────────────────────────────── */}
      <div
        className="relative w-full cursor-pointer select-none"
        onClick={handleDoubleTap}
      >
        {post.mediaType === "image" ? (
          <img
            src={post.mediaUrl}
            className="w-full object-cover max-h-[600px]"
            alt="post"
            draggable={false}
          />
        ) : (
          <video
            src={post.mediaUrl}
            controls
            className="w-full object-cover max-h-[600px]"
            preload="metadata"
          />
        )}

        {/* ── Double-tap heart burst ──────────────────────────────────── */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={90}
              className="fill-white/90 text-white drop-shadow-2xl animate-bounce-once"
              style={{
                animation: "heartBurst 0.9s ease forwards",
              }}
            />
          </div>
        )}
      </div>

      {/* ── ACTIONS ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          {/* Left: like, comment, share */}
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition-all active:scale-90 ${
                isLiked
                  ? "text-red-500 hover:bg-red-500/10"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart
                size={24}
                className={`transition-all duration-200 ${isLiked ? "fill-red-500 scale-110" : ""}`}
              />
            </button>

            {/* Comment */}
            <button
              onClick={() => {
                setShowComments((p) => !p);
                setTimeout(() => commentInput.current?.focus(), 100);
              }}
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Comment"
            >
              <MessageCircle size={24} />
            </button>

            {/* Share */}
            <button
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Share"
            >
              <Send size={22} className="-rotate-12" />
            </button>
          </div>

          {/* Right: bookmark */}
          <button
            onClick={() => setSaved((p) => !p)}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              saved
                ? "text-yellow-400 hover:bg-yellow-400/10"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            aria-label={saved ? "Unsave" : "Save"}
          >
            <Bookmark
              size={24}
              className={saved ? "fill-yellow-400" : ""}
            />
          </button>
        </div>

        {/* ── Likes count ────────────────────────────────────────────── */}
        {likesCount > 0 && (
          <p className="text-sm font-semibold text-white mb-1">
            {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
          </p>
        )}

        {/* ── Caption ────────────────────────────────────────────────── */}
        {post.caption && (
          <p className="text-sm text-gray-200 mb-1 leading-relaxed">
            <button
              onClick={() => navigate(`/profile/${postUser?._id}`)}
              className="font-semibold text-white hover:text-purple-300 transition-colors mr-1.5"
            >
              {postUser?.username}
            </button>
            {caption}
            {post.caption.length > 120 && (
              <button
                onClick={() => setShowFullCaption((p) => !p)}
                className="text-gray-500 ml-1 hover:text-gray-300 transition-colors text-xs"
              >
                {showFullCaption ? " less" : " more"}
              </button>
            )}
          </p>
        )}

        {/* ── Comments toggle ────────────────────────────────────────── */}
        {post.comments?.length > 0 && (
          <button
            onClick={() => setShowComments((p) => !p)}
            className="text-gray-500 hover:text-gray-300 text-sm mb-2 transition-colors"
          >
            {showComments ? "Hide comments" : `View all ${post.comments.length} comments`}
          </button>
        )}

        {/* ── Comments list ──────────────────────────────────────────── */}
        {showComments && post.comments?.length > 0 && (
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto scrollbar-hide">
            {post.comments.slice(-8).map((c) => (
              <div key={c._id} className="flex items-start gap-2">
                <img
                  src={avatar(c.userId?.profilePic, c.userId?.username)}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                  alt=""
                />
                <div>
                  <span className="text-xs font-semibold text-white mr-1.5">
                    {c.userId?.username || "User"}
                  </span>
                  <span className="text-xs text-gray-300">{c.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Add Comment Input ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/8">
          <img
            src={avatar(user?.profilePic, user?.username)}
            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            alt=""
          />
          <input
            ref={commentInput}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommentSubmit();
              }
            }}
            placeholder="Add a comment…"
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
          />
          {commentText.trim() && (
            <button
              onClick={handleCommentSubmit}
              disabled={submitting}
              className="text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? "…" : "Post"}
            </button>
          )}
        </div>
      </div>

      {/* ── Options Modal ─────────────────────────────────────────────── */}
      <PostOptionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        username={postUser?.username}
        postId={post._id}
        isOwnPost={postUser?._id === currentUserId}
      />

      {/* ── Heart burst keyframes (injected once via style tag) ────────── */}
      <style>{`
        @keyframes heartBurst {
          0%   { transform: scale(0.4); opacity: 0; }
          30%  { transform: scale(1.3); opacity: 1; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </article>
  );
};

export default Posthelper;
