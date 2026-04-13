import React, { useEffect, useRef, useState, useContext } from "react";
import { StoryContext } from "../Context/StoryContext";
import { X } from "lucide-react";

const STORY_DURATION = 5000;

const StoryViewer = () => {
  const {
    activeUserStories,
    activeStoryIndex,
    closeStoryViewer,
    viewStory,
    goToNextStory,
    goToPrevStory,
    goToNextUser,
    goToPrevUser
  } = useContext(StoryContext);

  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const currentStory =
    activeUserStories?.stories?.[activeStoryIndex] || null;

  /* =========================
     MARK VIEWED
  ========================= */
  useEffect(() => {
    if (currentStory?._id) {
      viewStory(currentStory._id);
    }
  }, [currentStory?._id]);

  /* =========================
     AUTO PROGRESS
  ========================= */
  useEffect(() => {
    if (!currentStory) return;

    setProgress(0);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / (STORY_DURATION / 50);
      });
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [activeStoryIndex, currentStory]);

  /* =========================
     KEYBOARD CONTROLS ✅
  ========================= */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeStoryViewer();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeStoryIndex, activeUserStories]);

  const handleNext = () => {
    const hasNext = goToNextStory();
    if (!hasNext) goToNextUser();
  };

  const handlePrev = () => {
    if (activeStoryIndex === 0) {
      goToPrevUser();
    } else {
      goToPrevStory();
    }
  };

  if (!activeUserStories || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Background blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl scale-110"
        style={{ backgroundImage: `url(${currentStory.mediaUrl})` }}
      />
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative w-[420px] max-w-full h-full md:h-[90vh] z-10 flex flex-col">
        {/* CLOSE BUTTON (TOP Z) */}
        <button
          onClick={closeStoryViewer}
          className="absolute top-4 right-4 z-40 text-white hover:scale-110 transition"
        >
          <X size={30} />
        </button>

        {/* PROGRESS */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-30">
          {activeUserStories.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded">
              <div
                className="h-full bg-white"
                style={{
                  width:
                    idx < activeStoryIndex
                      ? "100%"
                      : idx === activeStoryIndex
                      ? `${progress}%`
                      : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* STORY CONTENT */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
          {/* TAP AREAS (LOWER Z) */}
          <div
            className="absolute left-0 top-0 w-1/2 h-full z-10"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-0 w-1/2 h-full z-10"
            onClick={handleNext}
          />

          {currentStory.mediaType === "image" ? (
            <img
              src={currentStory.mediaUrl}
              className="max-h-full w-full object-contain select-none"
              draggable={false}
            />
          ) : (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="max-h-full w-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
