import React, { useState, useRef, useCallback } from 'react';
import ReelVideo from './ReelVideo';
import ReelActions from './ReelActions';
import ReelInfo from './ReelInfo';
import CommentsPanel from './CommentsPanel';

const ReelItem = ({ reel, isActive, onLike, engagementStatus, onOpenStakeModal, onComment, loadComments, trackView, onShare, onDelete }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [fullComments, setFullComments] = useState(reel.comments || []);
  const [loadingComments, setLoadingComments] = useState(false);

  // ── ML signal trackers (provided by ReelVideo via onTrackRef) ────────────────
  const trackersRef = useRef({ trackLike: null, trackShare: null, trackComment: null });
  const handleTrackRef = useCallback((trackers) => {
    trackersRef.current = trackers;
  }, []);

  const handleOpenComments = async () => {
    setCommentsOpen(true);
    trackersRef.current.trackComment?.();   // ← real comment-open signal for ML
    if (fullComments.length === (reel.comments?.length || 0) && fullComments.length >= 0) {
      setLoadingComments(true);
      const fresh = await loadComments(reel._id);
      setFullComments(fresh);
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (reelId, text) => {
    const comment = await onComment(reelId, text);
    return comment;
  };

  const handleLike = (reelId) => {
    trackersRef.current.trackLike?.();      // ← real like signal for ML
    onLike(reelId);
  };

  const handleShare = (reel) => {
    trackersRef.current.trackShare?.();     // ← real share signal for ML
    onShare?.(reel);
  };

  return (
    <div className="w-full h-full relative snap-start shrink-0 overflow-hidden bg-black">
      {/* Video Layer */}
      <ReelVideo
        src={reel.videoUrl}
        isActive={isActive}
        reelId={reel._id}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(m => !m)}
        onDoubleTap={() => handleLike(reel._id)}
        onView={trackView}
        onTrackRef={handleTrackRef}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 pointer-events-none" />

      {/* Info */}
      <ReelInfo reel={reel} />

      {/* Actions */}
      <ReelActions
        reel={reel}
        onLike={handleLike}
        onOpenComments={handleOpenComments}
        onStakeOpen={onOpenStakeModal}
        engagementStatus={engagementStatus}
        onShare={handleShare}
        onDelete={onDelete}
      />

      {/* Comments Panel */}
      <CommentsPanel
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        reelId={reel._id}
        initialComments={loadingComments ? [] : fullComments}
        onComment={handleAddComment}
      />
    </div>
  );
};

export default ReelItem;
