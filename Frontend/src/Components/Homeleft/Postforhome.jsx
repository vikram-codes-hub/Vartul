import { useEffect, useRef } from "react";
import { usePost } from "../../context/PostContext";
import Posthelper from "./Posthelper/Posthelper";

/* ── Skeleton Card ──────────────────────────────────────────────────────── */
const SkeletonPost = () => (
  <div className="w-full bg-[#0a0a0a] border border-white/8 rounded-2xl overflow-hidden animate-pulse">
    {/* Header */}
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-white/10 rounded-full w-32" />
        <div className="h-2.5 bg-white/5 rounded-full w-20" />
      </div>
    </div>
    {/* Media */}
    <div className="w-full h-72 sm:h-96 bg-white/[0.06]" />
    {/* Actions */}
    <div className="px-4 pt-3 pb-4 space-y-2">
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-white/10" />
        <div className="w-7 h-7 rounded-full bg-white/10" />
        <div className="w-7 h-7 rounded-full bg-white/10" />
      </div>
      <div className="h-3 bg-white/10 rounded-full w-24" />
      <div className="h-3 bg-white/5 rounded-full w-3/4" />
    </div>
  </div>
);

/* ── Main Feed ──────────────────────────────────────────────────────────── */
const Postforhome = () => {
  const { feedPosts, fetchFeedPosts, loading, hasMore } = usePost();

  /* Intersection observer sentinel for infinite scroll */
  const sentinelRef = useRef(null);

  /* Initial load */
  useEffect(() => {
    fetchFeedPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Infinite scroll trigger */
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchFeedPosts(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchFeedPosts]);

  const showSkeletons = loading && feedPosts.length === 0;

  return (
    <div className="space-y-6">
      {/* Skeleton loaders on first load */}
      {showSkeletons &&
        Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)}

      {/* Real posts */}
      {feedPosts.map((post) => (
        <Posthelper key={post._id} post={post} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-8" />

      {/* Loading more */}
      {loading && feedPosts.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && feedPosts.length > 0 && (
        <div className="flex flex-col items-center py-10 text-gray-600 gap-2">
          <div className="text-3xl">🎉</div>
          <p className="text-sm font-medium">You&apos;re all caught up!</p>
          <p className="text-xs">You&apos;ve seen all posts from people you follow.</p>
        </div>
      )}

      {/* Empty feed */}
      {!loading && feedPosts.length === 0 && (
        <div className="flex flex-col items-center py-16 text-gray-500 gap-3">
          <div className="text-5xl">📭</div>
          <p className="text-base font-semibold text-white">No posts yet</p>
          <p className="text-sm text-center">Follow people to see their posts here.</p>
        </div>
      )}
    </div>
  );
};

export default Postforhome;
