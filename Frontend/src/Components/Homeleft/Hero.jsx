// src/components/Hero.jsx
import React, { useRef, useState, useEffect, useContext } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Story from "./Story";
import { StoryContext } from "../../Context/StoryContext";
import { Usercontext } from "../../context/Usercontext";
import { uploadStoryApi } from "../../api/storyApi";

const Hero = () => {
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { stories, myStories, loading, fetchStoriesFeed, fetchMyStories } =
    useContext(StoryContext);
  const { user } = useContext(Usercontext);

  useEffect(() => {
    fetchStoriesFeed();
    fetchMyStories();
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      ref?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [stories, myStories]);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  /* ── Add Story Flow ────────────────────────────────────────────────── */
  const handleAddStoryClick = () => {
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const closePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploading(false);
  };

  const handleShareStory = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      await uploadStoryApi(formData);
      closePreview();
      fetchStoriesFeed();
      fetchMyStories();
    } catch (err) {
      console.error("Story upload failed:", err);
      alert("Failed to upload story. Please try again.");
      setUploading(false);
    }
  };

  if (loading) {
    /* Skeleton row while stories load */
    return (
      <div className="flex gap-4 overflow-x-hidden py-4 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 animate-pulse flex-shrink-0">
            <div className="w-[66px] h-[66px] rounded-full bg-white/10" />
            <div className="h-2.5 w-12 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const hasMyStories = myStories.length > 0;
  const allStories = stories || [];
  const myAvatar =
    user?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || "U")}&background=6d28d9&color=fff`;

  return (
    <>
      {/* ── STORY PREVIEW OVERLAY ────────────────────────────────────── */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={closePreview}
              className="text-white hover:text-gray-300 transition text-2xl font-light leading-none"
            >
              ✕
            </button>
            <button
              onClick={handleShareStory}
              disabled={uploading}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                uploading
                  ? "bg-white/20 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400"
              }`}
            >
              {uploading ? "Uploading…" : "Share Story"}
            </button>
          </div>

          {/* Media preview */}
          <div className="flex-1 flex items-center justify-center bg-black px-4">
            {selectedFile?.type.startsWith("image") ? (
              <img
                src={previewUrl}
                className="max-h-full max-w-full object-contain rounded-xl"
                alt="story preview"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-xl"
              />
            )}
          </div>
        </div>
      )}

      {/* ── STORY BAR ────────────────────────────────────────────────── */}
      <div className="relative w-full bg-black overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Scroll left */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-full items-center justify-center z-10 transition"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto py-4 px-4 scrollbar-hide"
        >
          {/* ── Add Story Button ───────────────────────────────────── */}
          {!hasMyStories && (
            <div
              className="flex flex-col items-center space-y-1 cursor-pointer flex-shrink-0 group"
              onClick={handleAddStoryClick}
            >
              <div className="relative">
                {/* Dashed gradient ring */}
                <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-gray-700 to-gray-600 group-hover:from-purple-600 group-hover:to-pink-500 transition-all duration-300">
                  <div className="w-full h-full rounded-full p-[2px] bg-black flex items-center justify-center overflow-hidden relative">
                    <img
                      src={myAvatar}
                      className="w-full h-full rounded-full object-cover opacity-60 group-hover:opacity-80 transition"
                      alt="Your story"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
                {/* Plus badge */}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                  <Plus size={12} className="text-white" strokeWidth={3} />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 group-hover:text-white transition truncate max-w-[70px] text-center">
                Add Story
              </p>
            </div>
          )}

          {/* ── Other stories ──────────────────────────────────────── */}
          {allStories.map((userStories) => (
            <Story key={userStories.userId} userStories={userStories} />
          ))}
        </div>

        {/* Scroll right */}
        {showRight && allStories.length > 0 && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-full items-center justify-center z-10 transition"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        )}
      </div>
    </>
  );
};

export default Hero;
