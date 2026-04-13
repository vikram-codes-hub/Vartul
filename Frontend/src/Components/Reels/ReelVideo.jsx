import React, { useRef, useEffect, useState, useCallback } from 'react';
import useWatchTime from '../../hooks/useWatchTime';

const DOUBLE_TAP_DELAY = 300;

const ReelVideo = ({ src, isActive, reelId, isMuted, onMuteToggle, onDoubleTap, onView }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const viewTrackedRef = useRef(false);

  // ── Watch-time tracking ────────────────────────────────────────────────────
  const { flushWatchData } = useWatchTime(reelId, duration, isPlaying);

  // ── Auto play/pause based on active state ──────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      setIsBuffering(true);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => { setIsPlaying(true); setIsBuffering(false); })
          .catch(() => { setIsPlaying(false); setIsBuffering(false); });
      }
    } else {
      // Flush watch session data when scrolling away
      flushWatchData();
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      viewTrackedRef.current = false;
    }
  }, [isActive]); // eslint-disable-line

  // ── Muted sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // ── Buffering events ───────────────────────────────────────────────────────
  const handleWaiting = useCallback(() => setIsBuffering(true), []);
  const handleCanPlay = useCallback(() => setIsBuffering(false), []);
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  // ── Progress tracking ──────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    setProgress(pct);

    // Track view after 3 seconds
    if (!viewTrackedRef.current && video.currentTime >= 3) {
      viewTrackedRef.current = true;
      onView?.(reelId);
    }
  }, [reelId, onView]);

  // ── Single / double tap ────────────────────────────────────────────────────
  const handleTap = useCallback((e) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
      e.stopPropagation();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
          if (videoRef.current?.paused) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [onDoubleTap]);

  // ── Seek on progress bar click ─────────────────────────────────────────────
  const handleSeek = useCallback((e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = ratio * videoRef.current.duration;
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-black select-none" onClick={handleTap}>
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onPlaying={() => setIsBuffering(false)}
      />

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Play/Pause overlay icon (only when paused and not buffering) */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Double-tap heart burst */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="w-28 h-28 text-red-500 animate-ping-once drop-shadow-2xl"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      )}

      {/* Mute / Unmute button */}
      <button
        onClick={(e) => { e.stopPropagation(); onMuteToggle?.(); }}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-30 transition-transform active:scale-90"
      >
        {isMuted ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer z-30 group"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-white transition-all duration-100 group-hover:bg-blue-400"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>
    </div>
  );
};

export default ReelVideo;
