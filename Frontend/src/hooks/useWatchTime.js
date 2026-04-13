import { useState, useEffect, useRef } from 'react';
import { logWatchSession, sendWatchHeartbeat } from '../api/engagement.api';

/**
 * Hook to track watch time for a video reel.
 * Implements Engagement Rules:
 * - < 60% watch -> ignore (backend)
 * - 60-90% -> valid engagement
 * - > 90% -> flag for verification
 */
const useWatchTime = (reelId, videoDuration, isPlaying) => {
  const [watchTimeMs, setWatchTimeMs] = useState(0);
  const startTimeRef = useRef(null);
  const totalWatchTimeRef = useRef(0);
  const hasSentRef = useRef(false);

  // Reset when reelId changes
  useEffect(() => {
    setWatchTimeMs(0);
    startTimeRef.current = null;
    totalWatchTimeRef.current = 0;
    hasSentRef.current = false;
  }, [reelId]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      startTimeRef.current = Date.now();

      // W2E: Ping heartbeat every 5 seconds of active watch time
      interval = setInterval(() => {
        sendWatchHeartbeat(reelId);
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
  }, [isPlaying]);

  const flushWatchData = () => {
    if (hasSentRef.current) return;
    
    // Calculate final time including current session if still playing
    let finalTime = totalWatchTimeRef.current;
    if (startTimeRef.current) {
      finalTime += (Date.now() - startTimeRef.current);
    }

    if (finalTime < 1000) return; // Ignore < 1s views

    const percentage = videoDuration > 0 
      ? Math.min((finalTime / 1000 / videoDuration) * 100, 100) 
      : 0;

    // Send to Engagement API
    // Backend handles the <60% ignore and >90% flag logic
    logWatchSession({
      reelId,
      watchTimeMs: finalTime,
      watchPercentage: percentage,
      timestamp: Date.now()
    });

    hasSentRef.current = true;
  };

  return {
    watchTimeMs,
    flushWatchData
  };
};

export default useWatchTime;
