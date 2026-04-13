import React from "react";
import { Flag, UserX, Link2, Star, Share2, Info, X, Trash2 } from "lucide-react";
import { usePost } from "../../../context/PostContext";
import { useNavigate } from "react-router-dom";

const PostOptionsModal = ({ isOpen, onClose, username, postId, isOwnPost }) => {
  const navigate = useNavigate();
  const { feedPosts, setFeedPosts } = usePost();

  if (!isOpen) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${postId}`);
    onClose();
  };

  const options = isOwnPost
    ? [
        { icon: <Trash2 size={18} />, label: "Delete post", danger: true, action: () => { onClose(); } },
        { icon: <Link2 size={18} />, label: "Copy link", action: copyLink },
        { icon: <Share2 size={18} />, label: "Share to…", action: onClose },
      ]
    : [
        { icon: <Flag size={18} />, label: "Report", danger: true, action: onClose },
        { icon: <UserX size={18} />, label: `Unfollow @${username}`, danger: true, action: onClose },
        { icon: <Star size={18} />, label: "Add to favourites", action: onClose },
        { icon: <Link2 size={18} />, label: "Copy link", action: copyLink },
        { icon: <Share2 size={18} />, label: "Share to…", action: onClose },
        { icon: <Info size={18} />, label: "About this account", action: () => { onClose(); navigate(`/profile/${postId}`); } },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Options */}
        <div className="divide-y divide-white/8 pb-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-white/5 ${
                opt.danger ? "text-red-400 hover:text-red-300" : "text-gray-200 hover:text-white"
              }`}
            >
              <span className={opt.danger ? "text-red-400" : "text-gray-400"}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} className="text-gray-500" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostOptionsModal;
