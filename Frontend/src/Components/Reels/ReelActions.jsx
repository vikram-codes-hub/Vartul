import React, { useContext } from 'react';
import { toast } from 'react-toastify';
import { Usercontext } from '../../Context/Usercontext.jsx';

const formatCount = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const ActionButton = ({ icon, label, onClick, isActive, colorClass = 'text-white', tooltip }) => (
  <button
    title={tooltip}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex flex-col items-center gap-1 mb-5 group"
  >
    <div
      className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-200 group-active:scale-90 group-hover:bg-black/60 ${isActive ? colorClass : 'text-white'}`}
    >
      {icon}
    </div>
    <span className="text-white text-xs font-semibold drop-shadow-lg">{label}</span>
  </button>
);

const ReelActions = ({ reel, onLike, onOpenComments, onStakeOpen, engagementStatus, onShare, onDelete }) => {
  const { authuser } = useContext(Usercontext);
  const isOwnReel = authuser?._id === reel.userId?._id?.toString() || authuser?._id === reel.userId?._id;

  const handleShare = async () => {
    const url = `${window.location.origin}/reels/${reel._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: reel.description || 'Check this reel', url });
        onShare?.(reel._id);
      } catch {/* user cancelled */}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!', { autoClose: 1500, position: 'bottom-center' });
      onShare?.(reel._id);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Delete this reel? This cannot be undone.')) {
      onDelete?.(reel._id);
    }
  };

  return (
    <div className="absolute right-3 bottom-16 flex flex-col items-center z-20">
      {/* Like */}
      <ActionButton
        tooltip="Like"
        icon={
          <svg className="w-6 h-6" fill={reel.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
        label={formatCount(reel.likesCount)}
        onClick={() => onLike(reel._id)}
        isActive={reel.isLiked}
        colorClass="text-red-500"
      />

      {/* Comment */}
      <ActionButton
        tooltip="Comments"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }
        label={formatCount(reel.commentsCount)}
        onClick={() => onOpenComments(reel._id)}
      />

      {/* Views */}
      <ActionButton
        tooltip="Views"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        }
        label={formatCount(reel.views)}
        onClick={() => {}}
      />

      {/* Earn TWT */}
      <ActionButton
        tooltip="Earn TWT tokens"
        icon={
          <svg className="w-6 h-6" fill={engagementStatus?.isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        label={engagementStatus?.isActive ? 'Earning' : 'Earn'}
        onClick={onStakeOpen}
        isActive={engagementStatus?.isActive}
        colorClass="text-yellow-400"
      />

      {/* Share */}
      <ActionButton
        tooltip="Share"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        }
        label={formatCount(reel.shares)}
        onClick={handleShare}
      />

      {/* Delete (own reel only) */}
      {isOwnReel && (
        <ActionButton
          tooltip="Delete reel"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
          label="Delete"
          onClick={handleDelete}
          colorClass="text-red-400"
        />
      )}
    </div>
  );
};

export default ReelActions;
