// src/context/StoryContext.jsx
import { createContext, useContext, useState } from "react";
import {
  getStoriesFeedApi,
  getMyStoriesApi,
  viewStoryApi,
  deleteStoryApi
} from "../api/StoryApi";
import { toast } from "react-hot-toast";

export const StoryContext = createContext();
export const useStory = () => useContext(StoryContext);

const StoryContextProvider = ({ children }) => {
  const [stories, setStories] = useState([]); // feed stories
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeUserStories, setActiveUserStories] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  /* Fetch stories feed */
  const fetchStoriesFeed = async () => {
    try {
      setLoading(true);
      const { data } = await getStoriesFeedApi();
      if (data.success) setStories(data.stories || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  /* Fetch my stories */
  const fetchMyStories = async () => {
    try {
      const { data } = await getMyStoriesApi();
      if (data.success) setMyStories(data.stories || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* Open / close viewer */
  const openStoryViewer = (userStories, startIndex = 0) => {
    if (!userStories || !userStories.stories?.length) return;
    setActiveUserStories(userStories);
    setActiveStoryIndex(startIndex);
  };

  const closeStoryViewer = () => {
    setActiveUserStories(null);
    setActiveStoryIndex(0);
  };

  /* View story */
  const viewStory = async (storyId) => {
    try {
      await viewStoryApi(storyId);

      // Update feed stories
      setStories((prev) =>
        prev.map((u) => ({
          ...u,
          stories: u.stories.map((s) =>
            s._id === storyId
              ? { ...s, viewed: true, viewCount: (s.viewCount || 0) + 1 }
              : s
          ),
          hasUnviewed: u.stories.some((s) => !s.viewed)
        }))
      );

      // Update active viewer
      if (activeUserStories) {
        setActiveUserStories((prev) => ({
          ...prev,
          stories: prev.stories.map((s) =>
            s._id === storyId
              ? { ...s, viewed: true, viewCount: (s.viewCount || 0) + 1 }
              : s
          )
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* Delete story */
  const deleteStory = async (storyId) => {
    try {
      const { data } = await deleteStoryApi(storyId);
      if (!data.success) return;

      setMyStories((prev) => prev.filter((s) => s._id !== storyId));

      if (activeUserStories) {
        const updated = activeUserStories.stories.filter(
          (s) => s._id !== storyId
        );

        if (updated.length === 0) {
          closeStoryViewer();
        } else {
          setActiveUserStories({
            ...activeUserStories,
            stories: updated
          });

          if (activeStoryIndex >= updated.length) {
            setActiveStoryIndex(updated.length - 1);
          }
        }
      }

      toast.success("Story deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete story");
    }
  };

  /* Story navigation */
  const goToNextStory = () => {
    if (!activeUserStories) return false;

    if (activeStoryIndex < activeUserStories.stories.length - 1) {
      setActiveStoryIndex((i) => i + 1);
      return true;
    }
    return false;
  };

  const goToPrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((i) => i - 1);
      return true;
    }
    return false;
  };

  /* User navigation (safe) */
  const buildAllStoriesArray = () => {
    const arr = [];

    if (myStories.length > 0) {
      arr.push({
        userId: myStories[0].userId,
        username: "You",
        profilePic: myStories[0].user?.profilePic,
        stories: myStories,
        hasUnviewed: false
      });
    }

    stories.forEach((s) => arr.push(s));
    return arr;
  };

  const goToNextUser = () => {
    if (!activeUserStories) return;

    const all = buildAllStoriesArray();

    const currentIndex = all.findIndex(
      (u) => u.userId === activeUserStories.userId
    );

    if (currentIndex === -1 || currentIndex >= all.length - 1) {
      closeStoryViewer();
      return;
    }

    openStoryViewer(all[currentIndex + 1], 0);
  };

  const goToPrevUser = () => {
    if (!activeUserStories) return;

    const all = buildAllStoriesArray();

    const currentIndex = all.findIndex(
      (u) => u.userId === activeUserStories.userId
    );

    if (currentIndex > 0) {
      openStoryViewer(
        all[currentIndex - 1],
        all[currentIndex - 1].stories.length - 1
      );
    }
  };

  return (
    <StoryContext.Provider
      value={{
        stories,
        myStories,
        loading,
        fetchStoriesFeed,
        fetchMyStories,
        viewStory,
        deleteStory,

        activeUserStories,
        activeStoryIndex,
        openStoryViewer,
        closeStoryViewer,
        goToNextStory,
        goToPrevStory,
        goToNextUser,
        goToPrevUser
      }}
    >
      {children}
    </StoryContext.Provider>
  );
};

export default StoryContextProvider;
