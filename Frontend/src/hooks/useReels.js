import { useState, useEffect, useCallback } from 'react';
import { fetchReels, likeReel, commentOnReel, getReelComments, sendWatchData, shareReel, deleteReel } from '../api/reels.api';
import { toast } from 'react-toastify';

const useReels = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const loadReels = useCallback(async (isInitial = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const pageToFetch = isInitial ? 1 : page;
      const response = await fetchReels(pageToFetch);
      const newReels = response.reels || [];

      if (newReels.length === 0 || !response.meta?.hasMore) {
        setHasMore(false);
      }

      setReels(prev => isInitial ? newReels : [...prev, ...newReels]);
      setPage(prev => isInitial ? 2 : pageToFetch + 1);
    } catch (err) {
      console.error('Failed to fetch reels:', err);
      setError('Failed to load reels. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, loading]);

  useEffect(() => {
    loadReels(true);
  }, []); // eslint-disable-line

  // ── LIKE ──────────────────────────────
  const handleLike = useCallback(async (reelId) => {
    // Optimistic update
    setReels(prev =>
      prev.map(r =>
        r._id === reelId
          ? { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1 }
          : r
      )
    );
    try {
      await likeReel(reelId);
    } catch {
      // Revert
      setReels(prev =>
        prev.map(r =>
          r._id === reelId
            ? { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1 }
            : r
        )
      );
      toast.error('Could not update like');
    }
  }, []);

  // ── COMMENT ───────────────────────────
  const handleComment = useCallback(async (reelId, text) => {
    try {
      const data = await commentOnReel(reelId, text);
      if (data.success) {
        setReels(prev =>
          prev.map(r =>
            r._id === reelId
              ? { ...r, commentsCount: data.commentsCount }
              : r
          )
        );
        return data.comment;
      }
    } catch {
      toast.error('Could not post comment');
      throw new Error('Comment failed');
    }
  }, []);

  // ── FETCH FULL COMMENTS ────────────────
  const loadComments = useCallback(async (reelId) => {
    try {
      const data = await getReelComments(reelId);
      return data.comments || [];
    } catch {
      toast.error('Could not load comments');
      return [];
    }
  }, []);

  // ── VIEW TRACKING ─────────────────────
  const trackView = useCallback((reelId) => {
    sendWatchData(reelId);
  }, []);

  // ── SHARE ─────────────────────────────
  const handleShare = useCallback(async (reelId) => {
    // Optimistic update
    setReels(prev =>
      prev.map(r =>
        r._id === reelId
          ? { ...r, shares: (r.shares || 0) + 1 }
          : r
      )
    );
    await shareReel(reelId);
  }, []);

  // ── DELETE ────────────────────────────
  const handleDelete = useCallback(async (reelId) => {
    try {
      await deleteReel(reelId);
      setReels(prev => prev.filter(r => r._id !== reelId));
      toast.success('Reel deleted');
    } catch {
      toast.error('Could not delete reel');
    }
  }, []);

  return {
    reels,
    loading,
    error,
    hasMore,
    loadMore: () => loadReels(false),
    handleLike,
    handleComment,
    loadComments,
    trackView,
    handleShare,
    handleDelete,
  };
};

export default useReels;
