import React, { useState } from 'react';
import ReelVideo from './ReelVideo';
import ReelActions from './ReelActions';
import ReelInfo from './ReelInfo';
import CommentsPanel from './CommentsPanel';

const ReelItem = ({ reel, isActive, onLike, engagementStatus, onOpenStakeModal, onComment, loadComments, trackView, onShare, onDelete }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [fullComments, setFullComments] = useState(reel.comments || []);
  const [loadingComments, setLoadingComments] = useState(false);

  const handleOpenComments = async () => {
    setCommentsOpen(true);
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

  return (
    <div className="w-full h-full relative snap-start shrink-0 overflow-hidden bg-black">
      {/* Video Layer */}
      <ReelVideo
        src={reel.videoUrl}
        isActive={isActive}
        reelId={reel._id}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(m => !m)}
        onDoubleTap={() => onLike(reel._id)}
        onView={trackView}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 pointer-events-none" />

      {/* Info */}
      <ReelInfo reel={reel} />

      {/* Actions */}
      <ReelActions
        reel={reel}
        onLike={onLike}
        onOpenComments={handleOpenComments}
        onStakeOpen={onOpenStakeModal}
        engagementStatus={engagementStatus}
        onShare={onShare}
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
