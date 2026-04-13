import { X, Heart, MessageCircle, Bookmark, Send, MoreHorizontal, Smile } from "lucide-react";
import { useContext, useState } from "react";
import { Usercontext } from "../Context/Usercontext";
import { usePost } from "../Context/PostContext";

const PostViewModal = ({ post, onClose }) => {
  const { user } = useContext(Usercontext);
  const { commentOnPost, toggleLike } = usePost();
  const [commentText, setCommentText] = useState("");

  if (!post || !user) return null;

  const isLiked = post.likes?.includes(user._id);

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentOnPost(post._id, commentText);
    setCommentText("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-black w-full max-w-6xl h-[95vh] max-h-[900px] rounded-lg overflow-hidden flex flex-col md:flex-row shadow-2xl">

        {/* LEFT: MEDIA */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-0">
          {post.mediaType === "image" ? (
            <img
              src={post.mediaUrl}
              className="max-h-full max-w-full object-contain"
              alt="post"
            />
          ) : (
            <video
              src={post.mediaUrl}
              controls
              className="max-h-full max-w-full"
            />
          )}
          
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-black border-t md:border-t-0 md:border-l border-gray-800">

          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <img
                src={post.userId?.profilePic || "/default-avatar.png"}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-800"
                alt="profile"
              />
              <span className="font-semibold text-white text-sm">
                {post.userId?.username || "User"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-white hover:text-gray-400 transition">
                <MoreHorizontal className="w-6 h-6" />
              </button>
              <button onClick={onClose} className="hidden md:block text-white hover:text-gray-400 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* CAPTION + COMMENTS */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

         

            {post.comments?.length === 0 && !post.caption && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-400 text-sm font-semibold mb-1">
                  No comments yet
                </p>
                <p className="text-gray-500 text-xs">
                  Start the conversation.
                </p>
              </div>
            )}

            {post.comments?.map((c) => (
              <div key={c._id} className="flex gap-3">
                <img
                  src={c.userId?.profilePic || "/default-avatar.png"}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  alt="profile"
                />
                <div className="flex-1">
                  <div className="text-sm text-white">
                    <span className="font-semibold mr-2">
                      {c.userId?.username || "User"}
                    </span>
                    <span className="text-gray-200">{c.text}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-gray-500">2d</p>
                    <button className="text-xs text-gray-500 font-semibold hover:text-gray-400">
                      Reply
                    </button>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-gray-400 transition mt-1">
                  <Heart className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="border-t border-gray-800">
            
            {/* Action Icons */}
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleLike(post._id)}
                  className="hover:text-gray-400 transition active:scale-90 transform"
                >
                  <Heart
                    className={`w-7 h-7 transition-all ${
                      isLiked
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    }`}
                  />
                </button>
                <button className="text-white hover:text-gray-400 transition active:scale-90 transform">
                  <MessageCircle className="w-7 h-7" />
                </button>
                <button className="text-white hover:text-gray-400 transition active:scale-90 transform">
                  <Send className="w-7 h-7" />
                </button>
              </div>
              <button className="text-white hover:text-gray-400 transition active:scale-90 transform">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>

            {/* Likes Count */}
            <div className="px-4 pb-2">
              <p className="font-semibold text-white text-sm">
                {(post.likes?.length || 0).toLocaleString()} {post.likes?.length === 1 ? 'like' : 'likes'}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">January 12, 2025</p>
            </div>

            {/* Comment Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-800">
              <button className="text-white hover:text-gray-400 transition">
                <Smile className="w-6 h-6" />
              </button>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
              />
              <button
                onClick={handleComment}
                className="text-blue-500 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:text-blue-400 transition"
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostViewModal;