import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReelItem from './ReelItem';
import ReelUploadModal from './ReelUploadModal';
import EngagementStakeModal from './EngagementStakeModal';
import useReels from '../../hooks/useReels';
import useEngagementStatus from '../../hooks/useEngagementStatus';

// ── Skeleton loader for a single reel ─────────────────────────────────────────
const ReelSkeleton = () => (
  <div className="w-full h-screen snap-start relative bg-[#0a0a0a] flex items-end pb-20 px-4 animate-pulse">
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-white/10" />
          <div className="h-2.5 w-16 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="h-3 w-48 rounded-full bg-white/10" />
      <div className="h-3 w-36 rounded-full bg-white/10" />
    </div>
    {/* Right side action buttons skeleton */}
    <div className="absolute right-4 bottom-20 flex flex-col items-center gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10" />
          <div className="h-2.5 w-6 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  </div>
);

const ReelFeed = () => {
  const {
    reels,
    loading,
    error,
    hasMore,
    loadMore,
    handleLike,
    handleComment,
    loadComments,
    trackView,
    handleShare,
    handleDelete,
  } = useReels();

  const engagementStatus = useEngagementStatus();
  const [activeReelId, setActiveReelId] = useState(null);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const reelObserver = useRef(null);
  const lastReelObserver = useRef(null);

  // ── Active reel detection (IntersectionObserver) ───────────────────────────
  const handleIntersection = useCallback((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        const id = entry.target.getAttribute('data-reel-id');
        setActiveReelId(id);
      }
    });
  }, []);

  useEffect(() => {
    if (reelObserver.current) reelObserver.current.disconnect();
    reelObserver.current = new IntersectionObserver(handleIntersection, { threshold: 0.6 });
    document.querySelectorAll('.reel-item').forEach(el => reelObserver.current.observe(el));
    return () => reelObserver.current?.disconnect();
  }, [reels, handleIntersection]);

  // ── Auto-set first active reel ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeReelId && reels.length > 0) {
      setActiveReelId(reels[0]._id);
    }
  }, [reels, activeReelId]);

  // ── Infinite scroll ref callback ───────────────────────────────────────────
  const lastReelCallback = useCallback((node) => {
    if (loading) return;
    if (lastReelObserver.current) lastReelObserver.current.disconnect();
    lastReelObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) loadMore();
    });
    if (node) lastReelObserver.current.observe(node);
  }, [loading, hasMore, loadMore]);

  // ── New reel uploaded callback ─────────────────────────────────────────────
  const handleUploadSuccess = (newReel) => {
    // Reload feed to show the new reel at top
    window.location.reload();
  };

  return (
    // Outer: positions the centered column
    <div className="w-full h-screen bg-black flex justify-center overflow-hidden">
      {/* Inner scrollable column: max-width keeps it phone-like on desktop */}
      <div className="relative w-full max-w-[480px] h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide">

        {/* ── Skeleton while initial loading ── */}
        {loading && reels.length === 0 && (
          <>
            <ReelSkeleton />
            <ReelSkeleton />
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && reels.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-white gap-5">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.816v6.368a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-semibold text-base">No reels yet</p>
              <p className="text-gray-400 text-sm">Be the first to share something!</p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-sm font-semibold hover:from-blue-500 hover:to-purple-500 transition-all active:scale-95"
            >
              Upload Reel
            </button>
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-white gap-3">
            <svg className="w-12 h-12 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-400 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* ── Reel items ── */}
        {reels.map((reel, index) => {
          const isLast = index === reels.length - 1;
          return (
            <div
              key={reel._id}
              ref={isLast ? lastReelCallback : null}
              data-reel-id={reel._id}
              className="reel-item w-full h-screen snap-start relative"
            >
              <ReelItem
                reel={reel}
                isActive={activeReelId === reel._id}
                onLike={handleLike}
                engagementStatus={engagementStatus}
                onOpenStakeModal={() => setIsStakeModalOpen(true)}
                onComment={handleComment}
                loadComments={loadComments}
                trackView={trackView}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            </div>
          );
        })}

        {/* ── Loading more spinner ── */}
        {loading && reels.length > 0 && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center z-50">
            <div className="w-7 h-7 border-3 border-t-white border-white/20 rounded-full animate-spin" />
          </div>
        )}

        {/* ── Upload FAB ── */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-900/40 hover:scale-110 active:scale-95 transition-transform"
          title="Upload Reel"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* ── Modals ── */}
      <EngagementStakeModal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
        onSuccess={() => engagementStatus.refreshStatus?.()}
      />

      <ReelUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default ReelFeed;
