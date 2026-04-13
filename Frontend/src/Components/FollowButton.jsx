import { useState } from "react";
import { followUserApi, unfollowUserApi } from "../api/followApi";

const FollowButton = ({ userId, isFollowing, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (isFollowing) {
        await unfollowUserApi(userId);
        onSuccess(false);
      } else {
        await followUserApi(userId);
        onSuccess(true);
      }
    } catch (error) {
      console.error("Follow action failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-1 rounded-md border"
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
