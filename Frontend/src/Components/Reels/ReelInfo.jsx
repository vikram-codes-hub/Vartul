import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { followUserApi, unfollowUserApi } from '../../api/followApi';
import { Usercontext } from '../../Context/Usercontext.jsx';

const ReelInfo = ({ reel }) => {
  const { authuser } = useContext(Usercontext);
  const [expanded, setExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(reel.isFollowing || false);
  const [followLoading, setFollowLoading] = useState(false);

  const creatorId = reel.userId?._id;
  const isOwnReel = authuser?._id === creatorId?.toString();
  const displayName = reel.userId?.username || reel.creatorName || 'user';
  const avatar =
    reel.userId?.profilePic ||
    reel.creatorAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`;
  const description = reel.description || '';
  const audioName = reel.audioName || `Original Audio · ${displayName}`;
  const tags = reel.tags || [];

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (followLoading || !creatorId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUserApi(creatorId);
        setIsFollowing(false);
      } else {
        await followUserApi(creatorId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow error', err);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="absolute bottom-3 left-3 right-16 z-20 text-white">
      {/* Creator row */}
      <div className="flex items-center gap-2.5 mb-2">
        <Link to={`/profile/${creatorId}`} onClick={e => e.stopPropagation()}>
          <img
            src={avatar}
            alt={displayName}
            className="w-10 h-10 rounded-full border-2 border-white/60 object-cover shadow-lg"
          />
        </Link>
        <Link
          to={`/profile/${creatorId}`}
          onClick={e => e.stopPropagation()}
          className="font-bold text-sm drop-shadow-lg hover:underline"
        >
          @{displayName}
          {reel.userId?.isVerified && (
            <svg className="inline w-3.5 h-3.5 ml-1 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
        </Link>

        {/* Follow button – hide on own reel */}
        {!isOwnReel && creatorId && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`ml-1 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm transition-all duration-200 disabled:opacity-60 ${
              isFollowing
                ? 'bg-white/20 border border-white/40 text-white hover:bg-white/10'
                : 'bg-transparent border border-white/70 text-white hover:bg-white hover:text-black'
            }`}
          >
            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Description */}
      {description.length > 0 && (
        <div className="mb-2 max-w-xs">
          <p className={`text-sm leading-snug drop-shadow-lg ${expanded ? '' : 'line-clamp-2'}`}>
            {description}
          </p>
          {description.length > 80 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-xs text-gray-300 font-semibold mt-0.5"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="text-xs text-blue-300 font-medium drop-shadow-lg">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Audio */}
      <div className="flex items-center gap-1.5 text-xs opacity-90">
        <div className="flex gap-px items-end h-3.5">
          {[3, 4, 2, 5, 3].map((h, i) => (
            <div
              key={i}
              className="w-0.5 bg-white rounded-full animate-pulse"
              style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <span className="truncate max-w-[160px] drop-shadow-lg">{audioName}</span>
      </div>
    </div>
  );
};

export default ReelInfo;
