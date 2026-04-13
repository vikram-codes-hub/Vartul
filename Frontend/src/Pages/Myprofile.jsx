import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Grid3X3, Clapperboard, Bookmark, Tag, Camera, Plus, Share2 } from "lucide-react";
import { Usercontext } from "../Context/Usercontext";
import { usePost } from "../Context/PostContext";

const TABS = [
  { key: "POSTS",  icon: Grid3X3,    label: "Posts" },
  { key: "REELS",  icon: Clapperboard, label: "Reels" },
  { key: "SAVED",  icon: Bookmark,   label: "Saved" },
  { key: "TAGGED", icon: Tag,        label: "Tagged" },
];

const avatar = (src, name) =>
  src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=6d28d9&color=fff`;

const Myprofile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("POSTS");

  const { user, loading, fetchStats, stats } = useContext(Usercontext);
  const { userPosts, fetchUserPosts } = usePost();

  useEffect(() => {
    if (user?._id) {
      fetchStats(user._id);
      fetchUserPosts(user._id);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="w-full bg-black min-h-screen text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-black min-h-screen text-white">

      {/* ── PROFILE HEADER ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-10 pb-6">

        {/* Avatar + Info row */}
        <div className="flex items-center gap-6 md:gap-12 mb-6">

          {/* Avatar — purple ring accent instead of gradient rainbow */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-[2px] bg-purple-500/40">
              <div className="w-full h-full rounded-full p-[2px] bg-black">
                <img
                  src={avatar(user?.profilePic, user?.username)}
                  className="w-full h-full rounded-full object-cover"
                  alt={user?.username}
                  onError={(e) => { e.target.src = avatar(null, user?.username); }}
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Username + actions */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h1 className="text-base md:text-lg font-semibold tracking-wide">{user?.username}</h1>
              <button
                onClick={() => navigate("/edit-profile")}
                className="bg-white/8 hover:bg-white/14 border border-white/10 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              >
                Edit profile
              </button>
              <button
                onClick={() => {}}
                className="bg-white/8 hover:bg-white/14 border border-white/10 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              >
                Share
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="p-1.5 hover:bg-white/8 rounded-lg transition-all duration-150 text-gray-400 hover:text-white"
                title="Settings"
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-4">
              {[
                { count: stats.posts,     label: "posts" },
                { count: stats.followers, label: "followers" },
                { count: stats.following, label: "following" },
              ].map(({ count, label }) => (
                <button key={label} className="text-left hover:opacity-70 transition-opacity">
                  <span className="font-bold text-sm">{count}</span>
                  <span className="text-gray-500 ml-1 text-sm">{label}</span>
                </button>
              ))}
            </div>

            {/* Name + bio */}
            <div className="space-y-0.5">
              {user?.name && (
                <p className="font-semibold text-sm">{user.name}</p>
              )}
              {user?.bio ? (
                <p className="text-sm text-gray-400 whitespace-pre-line max-w-xs leading-relaxed">{user.bio}</p>
              ) : (
                <p className="text-sm text-gray-600 italic">Add a bio...</p>
              )}
              {user?.website && (
                <a
                  href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-purple-400 hover:underline"
                >
                  {user.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Story highlights */}
        <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-1">
          <button className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-700 group-hover:border-gray-500 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-300 transition-colors">New</span>
          </button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-white/8">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="flex justify-center gap-1">
            {TABS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold tracking-wider border-t-2 transition-all duration-150 ${
                  activeTab === key
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-gray-600 hover:text-gray-300"
                }`}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT GRID ───────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-2 pb-24">

        {activeTab === "POSTS" && (
          <>
            {userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="w-16 h-16 rounded-full border border-gray-800 flex items-center justify-center">
                  <Camera size={28} className="text-gray-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1">Share Photos</h3>
                  <p className="text-gray-600 text-sm max-w-xs">
                    When you share photos, they'll appear on your profile.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/")}
                  className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
                >
                  Share your first photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                {userPosts.map((post) => (
                  <div
                    key={post._id}
                    onClick={() => navigate(`/p/${post._id}`)}
                    className="aspect-square bg-gray-900 relative overflow-hidden cursor-pointer group"
                  >
                    {post.mediaType === "image" ? (
                      <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={post.mediaUrl} className="w-full h-full object-cover" muted />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5">
                      <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {post.likes.length}
                      </div>
                      <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                        {post.comments.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab !== "POSTS" && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full border border-gray-800 flex items-center justify-center">
              {activeTab === "REELS"  && <Clapperboard size={28} className="text-gray-700" />}
              {activeTab === "SAVED"  && <Bookmark     size={28} className="text-gray-700" />}
              {activeTab === "TAGGED" && <Tag          size={28} className="text-gray-700" />}
            </div>
            <div>
              <h3 className="text-base font-bold mb-1">
                {activeTab === "REELS"  && "No reels yet"}
                {activeTab === "SAVED"  && "Nothing saved yet"}
                {activeTab === "TAGGED" && "No tagged posts"}
              </h3>
              <p className="text-gray-600 text-sm">
                {activeTab === "REELS"  && "Reels you share will appear here."}
                {activeTab === "SAVED"  && "Save posts to view them later."}
                {activeTab === "TAGGED" && "Posts you're tagged in will appear here."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Myprofile;