import { useState, useEffect, useRef, useCallback } from 'react';
import { logWatchSession, sendWatchHeartbeat } from '../api/engagement.api';
import { toast } from 'react-toastify';

/**
 * useWatchTime — Real behavioral signal tracking for ML bot detection
 *
 * Tracks:
 *  - scrollSpeed     : actual wheel/touch delta events per second
 *  - skipTime        : seconds into video when user first started watching
 *  - watchPercentage : real video position / duration
 *  - sessionDuration : wall-clock time since session start
 *  - videosPerSession: count of reels scrolled through
 *  - interactions    : like/share/comment counts this session (passed in)
 */
const useWatchTime = (reelId, videoDuration, isPlaying, videoRef = null) => {
  const [watchTimeMs, setWatchTimeMs] = useState(0);
  const [trustScore,  setTrustScore]  = useState(100);

  // ── Core watch tracking ──────────────────────────────────────────────────────
  const startTimeRef      = useRef(null);
  const totalWatchTimeRef = useRef(0);
  const hasSentRef        = useRef(false);

  // ── Session-level signals ────────────────────────────────────────────────────
  const sessionStartRef      = useRef(Date.now());
  const videosWatchedRef     = useRef(1);
  const videoStartTimeRef    = useRef(null);   // video.currentTime when play started

  // ── Scroll speed tracking ────────────────────────────────────────────────────
  const scrollEventsRef   = useRef([]);        // timestamps of scroll events
  const lastScrollTimeRef = useRef(null);

  // ── Interaction counts (session-level) ───────────────────────────────────────
  const interactionsRef = useRef({ likes: 0, shares: 0, comments: 0 });

  // ── Tab visibility (pause watch time when tab is hidden) ─────────────────────
  const hiddenAtRef = useRef(null);

  // ── Computed scroll speed (events/sec over last 3s window) ───────────────────
  const getScrollSpeed = useCallback(() => {
    const now = Date.now();
    const window3s = scrollEventsRef.current.filter(t => now - t < 3000);
    scrollEventsRef.current = window3s; // prune old events
    return parseFloat((window3s.length / 3).toFixed(2)); // events per second
  }, []);

  // ── Real skip time: how deep into the video they started (currentTime at play)
  const getSkipTime = useCallback(() => {
    if (videoStartTimeRef.current !== null) return videoStartTimeRef.current;
    // Fallback: read from the video element directly
    if (videoRef?.current) return Math.round(videoRef.current.currentTime);
    return 0;
  }, [videoRef]);

  // ── Reset on reel change ─────────────────────────────────────────────────────
  useEffect(() => {
    setWatchTimeMs(0);
    startTimeRef.current      = null;
    totalWatchTimeRef.current = 0;
    hasSentRef.current        = false;
    videoStartTimeRef.current = null;
    videosWatchedRef.current += 1;
    scrollEventsRef.current   = [];
  }, [reelId]);

  // ── Scroll speed listener ────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      scrollEventsRef.current.push(now);
      lastScrollTimeRef.current = now;
    };

    // Track both mouse wheel and touch swipe (mobile)
    window.addEventListener('wheel',       handleScroll, { passive: true });
    window.addEventListener('touchmove',   handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel',     handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, []);

  // ── Tab visibility: don't count hidden time as watch time ────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        // Flush accumulated time before hiding
        if (startTimeRef.current) {
          totalWatchTimeRef.current += Date.now() - startTimeRef.current;
          startTimeRef.current = null;
        }
      } else {
        hiddenAtRef.current = null;
        // Resume timing if playing
        if (isPlaying) {
          startTimeRef.current = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isPlaying]);

  // ── Heartbeat response handler ───────────────────────────────────────────────
  const handleHeartbeatResponse = useCallback((data) => {
    if (!data) return;

    if (typeof data.trustScore === 'number') {
      setTrustScore(data.trustScore);
    }

    if (data.botWarning) {
      if (data.botAction === 'slash_stake') {
        toast.error('🚨 Suspicious activity detected — your stake has been suspended.', {
          autoClose: 8000,
          toastId:   'bot-slash',
        });
      } else if (data.botAction === 'remove_rewards') {
        toast.warn('⚠️ Suspicious activity detected — rewards paused for this session.', {
          autoClose: 6000,
          toastId:   'bot-warn',
        });
      }
    }
  }, []);

  // ── Main play/pause effect + heartbeat interval ──────────────────────────────
  useEffect(() => {
    let interval;

    if (isPlaying) {
      // Capture the video.currentTime when play starts — this is the real skipTime
      if (videoRef?.current && videoStartTimeRef.current === null) {
        videoStartTimeRef.current = Math.round(videoRef.current.currentTime);
      }

      startTimeRef.current = Date.now();

      interval = setInterval(async () => {
        if (document.hidden) return; // don't send heartbeats when tab is hidden

        const currentWatchMs = totalWatchTimeRef.current +
          (Date.now() - (startTimeRef.current || Date.now()));

        const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000);

        // Real watchPercentage from video element if available, else calculate
        let watchPercentage;
        if (videoRef?.current && videoDuration > 0) {
          watchPercentage = Math.min(
            (videoRef.current.currentTime / videoDuration) * 100,
            100
          );
        } else if (videoDuration > 0) {
          watchPercentage = Math.min((currentWatchMs / 1000 / videoDuration) * 100, 100);
        } else {
          watchPercentage = 60;
        }

        const data = await sendWatchHeartbeat(reelId, {
          watchTimeMs:      5000,
          watchPercentage:  Math.round(watchPercentage),
          sessionDuration,
          videosPerSession: videosWatchedRef.current,
          // ── REAL signals ──
          scrollSpeed:      getScrollSpeed(),
          skipTime:         getSkipTime(),
          likes:            interactionsRef.current.likes,
          shares:           interactionsRef.current.shares,
          comments:         interactionsRef.current.comments,
        });

        handleHeartbeatResponse(data);
      }, 5000);

    } else {
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current;
        totalWatchTimeRef.current += duration;
        setWatchTimeMs(totalWatchTimeRef.current);
        startTimeRef.current = null;
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current;
        totalWatchTimeRef.current += duration;
        setWatchTimeMs(totalWatchTimeRef.current);
        startTimeRef.current = null;
      }
    };
  }, [isPlaying, reelId, videoDuration, videoRef, getScrollSpeed, getSkipTime, handleHeartbeatResponse]);

  // ── Flush final watch data on reel change / unmount ─────────────────────────
  const flushWatchData = () => {
    if (hasSentRef.current) return;

    let finalTime = totalWatchTimeRef.current;
    if (startTimeRef.current) {
      finalTime += Date.now() - startTimeRef.current;
    }

    if (finalTime < 1000) return;

    const percentage = videoDuration > 0
      ? Math.min((finalTime / 1000 / videoDuration) * 100, 100)
      : 0;

    logWatchSession({
      reelId,
      watchTimeMs:     finalTime,
      watchPercentage: percentage,
      timestamp:       Date.now(),
    });

    hasSentRef.current = true;
  };

  // ── Track interactions (call these from your Like/Share/Comment handlers) ────
  const trackLike    = useCallback(() => { interactionsRef.current.likes++;    }, []);
  const trackShare   = useCallback(() => { interactionsRef.current.shares++;   }, []);
  const trackComment = useCallback(() => { interactionsRef.current.comments++; }, []);

  return { watchTimeMs, flushWatchData, trustScore, trackLike, trackShare, trackComment };
};

export default useWatchTime;
