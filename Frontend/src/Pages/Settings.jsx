import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, User, Bell, Lock, Shield, HelpCircle, Info,
  Moon, LogOut, AlertTriangle, X, Check
} from "lucide-react";
import { Usercontext } from "../Context/Usercontext";
import { toast } from "react-toastify";

/* ── Toggle switch ──────────────────────────────────────────────────────── */
const Toggle = ({ value, onChange }) => (
  <button
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
      value ? "bg-gradient-to-r from-purple-600 to-pink-500" : "bg-gray-700"
    }`}
  >
    <div
      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
        value ? "translate-x-6" : "translate-x-0.5"
      }`}
    />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, Logout } = useContext(Usercontext);

  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleToggle = (setter, value, name) => {
    setter(!value);
    toast.success(`${name} ${!value ? "enabled" : "disabled"}`);
  };

  const handleComingSoon = () => toast.info("Coming soon!");

  const handleLogout = () => {
    Logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const avatar = (src, name) =>
    src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=6d28d9&color=fff`;

  const sections = [
    {
      title: "Account",
      icon: User,
      items: [
        { label: "Edit Profile", action: () => navigate("/edit-profile") },
        { label: "Change Password", action: handleComingSoon },
        { label: "Posts You've Liked", action: handleComingSoon },
        { label: "Saved", action: handleComingSoon },
        { label: "Close Friends", action: handleComingSoon },
        { label: "Language", action: handleComingSoon },
      ],
    },
    {
      title: "Privacy",
      icon: Lock,
      items: [
        {
          label: "Account Privacy",
          toggle: true,
          value: privateAccount,
          onChange: () => handleToggle(setPrivateAccount, privateAccount, "Private Account"),
          description: "Only approved followers can see your content",
        },
        { label: "Activity Status", action: handleComingSoon },
        { label: "Story Settings", action: handleComingSoon },
        { label: "Blocked Accounts", action: handleComingSoon },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Push Notifications",
          toggle: true,
          value: notifications,
          onChange: () => handleToggle(setNotifications, notifications, "Push Notifications"),
          description: "Get notified about likes, comments & follows",
        },
        { label: "Email Notifications", action: handleComingSoon },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      items: [
        { label: "Two-Factor Authentication", action: handleComingSoon },
        { label: "Login Activity", action: handleComingSoon },
        { label: "Security Checkup", action: handleComingSoon },
      ],
    },
    {
      title: "Help",
      icon: HelpCircle,
      items: [
        { label: "Help Center", action: handleComingSoon },
        { label: "Report a Problem", action: handleComingSoon },
        { label: "Support Requests", action: handleComingSoon },
      ],
    },
    {
      title: "About",
      icon: Info,
      items: [
        { label: "Terms of Service", action: handleComingSoon },
        { label: "Privacy Policy", action: handleComingSoon },
        { label: "Community Guidelines", action: handleComingSoon },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/8 px-6 py-4">
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── USER CARD ──────────────────────────────────────────────── */}
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-4 p-4 bg-[#111] border border-white/8 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
        >
          <img
            src={avatar(user?.profilePic, user?.username)}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            alt=""
            onError={(e) => { e.target.src = avatar(null, user?.username); }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{user?.name || user?.username}</p>
            <p className="text-sm text-gray-400 truncate">@{user?.username}</p>
            {user?.email && (
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
            )}
          </div>
          <ChevronRight size={18} className="text-gray-500 flex-shrink-0" />
        </div>

        {/* ── DARK MODE CARD ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 bg-[#111] border border-white/8 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
              <Moon size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Dark Mode</p>
              <p className="text-xs text-gray-500">Switch between themes</p>
            </div>
          </div>
          <Toggle value={darkMode} onChange={() => handleToggle(setDarkMode, darkMode, "Dark Mode")} />
        </div>

        {/* ── SECTIONS ───────────────────────────────────────────────── */}
        {sections.map((section) => {
          const IconComp = section.icon;
          return (
            <div key={section.title} className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
                <IconComp size={16} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {section.title}
                </p>
              </div>

              {/* Items */}
              {section.items.map((item, i) => (
                <div
                  key={i}
                  onClick={() => { if (!item.toggle) item.action?.(); }}
                  className={`flex items-center justify-between px-4 py-3.5 border-b border-white/5 last:border-b-0 transition-colors ${
                    !item.toggle ? "cursor-pointer hover:bg-white/5" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  {item.toggle ? (
                    <Toggle value={item.value} onChange={item.onChange} />
                  ) : (
                    <ChevronRight size={16} className="text-gray-600" />
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {/* ── LOGOUT ─────────────────────────────────────────────────── */}
        <div className="space-y-3 pb-10">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold text-sm transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>

          <div className="text-center text-gray-600 text-xs pb-4">
            <p>© 2025 Vartul · Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* ── LOGOUT CONFIRMATION MODAL ──────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            {/* Icon */}
            <div className="flex flex-col items-center p-6 pb-4 gap-3">
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold">Log out?</h2>
              <p className="text-sm text-gray-400 text-center">
                Are you sure you want to log out of your Vartul account?
              </p>
            </div>
            {/* Actions */}
            <div className="grid grid-cols-2 border-t border-white/8">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors border-r border-white/8"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Check size={16} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;