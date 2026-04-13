import React, { useContext } from "react";
import { StoryContext } from "../../Context/StoryContext";

const Story = ({ userStories, isOwnStory = false }) => {
  const { openStoryViewer } = useContext(StoryContext);

  // ✅ SAFELY DERIVE USER DATA
  const username =
    userStories.user?.username || userStories.username || "Unknown";

  const profilePic =
    userStories.user?.profilePic ||
    userStories.profilePic ||
    "/default-avatar.png";

  const stories = userStories.stories || [];
  const hasUnviewed = userStories.hasUnviewed ?? false;
  const storyCount = stories.length;

  if (storyCount === 0) return null;

  const handleClick = () => {
    openStoryViewer(userStories);
  };

  const thumbnail = stories[0]?.mediaUrl || profilePic;

  return (
    <div
      className="flex flex-col items-center space-y-1 cursor-pointer group"
      onClick={handleClick}
    >
      {/* Story ring */}
      <div className="relative">
        <div
          className={`w-[66px] h-[66px] rounded-full p-[2.5px] ${
            hasUnviewed
              ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
              : "bg-gray-400"
          } group-hover:scale-105 transition-transform`}
        >
          <div className="w-full h-full rounded-full p-[3px] bg-black">
            <img
              src={thumbnail}
              alt={username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Story count */}
        {storyCount > 1 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-black">
            {storyCount}
          </div>
        )}

        {/* Own story + icon */}
        {isOwnStory && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 text-white text-lg rounded-full flex items-center justify-center border-2 border-black">
            +
          </div>
        )}
      </div>

      {/* Username */}
      <p className="text-xs text-white max-w-[70px] truncate">
        {isOwnStory ? "Your Story" : username}
      </p>
    </div>
  );
};

export default Story;
