import React, { useState, useContext } from "react";
import { dummySuggested } from "../../assets/Storydummydata";
import { Usercontext } from "../../context/Usercontext";
import axiosInstance from "../../Utils/axiosInstance";
import { useNavigate } from "react-router-dom";

const Homeright = () => {
  const { authuser } = useContext(Usercontext);
  const navigate = useNavigate();
  const [follow, setFollow] = useState({});

  const footerLinks = [
    ["About", "Help", "Press", "API", "Jobs", "Privacy"],
    ["Terms", "Locations", "Language", "Meta Verified"],
  ];

  const handleFollow = async (userId, idx) => {
    const alreadyFollowing = follow[idx];
    setFollow((prev) => ({ ...prev, [idx]: !prev[idx] }));
    try {
      await axiosInstance.post(
        `/api/follow/${alreadyFollowing ? "unfollow" : "follow"}/${userId}`
      );
    } catch {
      setFollow((prev) => ({ ...prev, [idx]: alreadyFollowing }));
    }
  };

  const avatarFallback = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=6d28d9&color=fff`;

  return (
    <div className="hidden xl:block w-[320px] sticky top-0 h-screen overflow-y-auto py-8 px-2">
      <div className="w-full">
        {/* ── Current user ──────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-5 px-2">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            onClick={() => navigate("/profile")}
          >
            <img
              src={authuser?.profilePic || avatarFallback(authuser?.username || authuser?.name)}
              className="w-11 h-11 rounded-full object-cover border border-white/10"
              alt="Profile"
              onError={(e) => { e.target.src = avatarFallback(authuser?.username); }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {authuser?.username || "You"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {authuser?.name || authuser?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="text-xs text-blue-400 font-semibold hover:text-white transition-colors"
          >
            View
          </button>
        </div>

        {/* ── Suggestions header ────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-4 px-2">
          <p className="text-sm text-gray-400 font-semibold">Suggested for you</p>
          <button className="text-xs text-white font-semibold hover:text-gray-300 transition-colors">
            See All
          </button>
        </div>

        {/* ── Suggested users ───────────────────────────────────────────── */}
        <div className="space-y-3 mb-6">
          {dummySuggested.map((u, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-2 py-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={u.profile || avatarFallback(u.username)}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  alt={u.username}
                  onError={(e) => { e.target.src = avatarFallback(u.username); }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {u.followedBy || "Suggested for you"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleFollow(u._id || u.username, i)}
                className={`text-xs font-semibold flex-shrink-0 ml-2 transition-colors ${
                  follow[i]
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-blue-400 hover:text-blue-300"
                }`}
              >
                {follow[i] ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>

        {/* ── Footer links ──────────────────────────────────────────────── */}
        <div className="mt-10 px-2 space-y-3">
          {footerLinks.map((row, idx) => (
            <div key={idx} className="flex flex-wrap gap-x-2 gap-y-1">
              {row.map((link, i) => (
                <React.Fragment key={link}>
                  <a href="#" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
                    {link}
                  </a>
                  {i < row.length - 1 && (
                    <span className="text-[11px] text-gray-600">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
          <p className="text-[11px] text-gray-600 mt-4">© 2025 VARTUL FROM MANIPAL</p>
        </div>
      </div>
    </div>
  );
};

export default Homeright;