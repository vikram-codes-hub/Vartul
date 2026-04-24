import { createContext, useContext, useState } from "react";
import axios from "axios";
import { Usercontext } from "./Usercontext";
import User from "../../../Backend/Models/User";

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [feedPosts, setFeedPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const {token, setuser,user}=useContext(Usercontext)



  const authHeader = {
    headers: {
      token,
    },
  };

  // Fetch feed posts
  const fetchFeedPosts = async (reset = false) => {
    try {
      if (loading) return;

      setLoading(true);

      const currentPage = reset ? 1 : page;

      const res = await axios.get(
        `/api/post/feed?page=${currentPage}&pageSize=10`,
        authHeader
      );

      const newPosts = res.data.posts;

      setFeedPosts((prev) =>
        reset ? newPosts : [...prev, ...newPosts]
      );

      setHasMore(res.data.meta.hasMore);
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Fetch feed error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user posts (profile grid)
  const fetchUserPosts = async (userId) => {
    try {
      const res = await axios.get(
        `/api/post/user/${userId}`,
       {headers: { token } }
      );
      setUserPosts(res.data.posts);
    } catch (error) {
      console.error("Fetch user posts error:", error);
    }
  };

  // Create post
  const createPost = async ({ caption, media, mediaType }) => {
    try {
    
      const res = await axios.post(
        "/api/post/create",
        { caption, media, mediaType },
        { headers: { token } }
      );
  
       const newPost = res.data.post;
      // Add post to feed instantly
      setFeedPosts((prev) => [newPost, ...prev]);
        setUserPosts((prev) => [newPost, ...prev]);
        setuser((prev) => ({
    ...prev,
    postsCount: prev.postsCount + 1,
  }));
      return res.data.post;
    } catch (error) {
      console.error("Create post error:", error);
      throw error;
    }
  };

  // Like / unlike post
const toggleLike = async (postId) => {
  if (!user?._id) return;


  setFeedPosts((prev) =>
    prev.map((post) =>
      post._id === postId
        ? {
            ...post,
            likes: post.likes.includes(user._id)
              ? post.likes.filter((id) => id !== user._id)
              : [...post.likes, user._id],
          }
        : post
    )
  );

  setUserPosts((prev) =>
    prev.map((post) =>
      post._id === postId
        ? {
            ...post,
            likes: post.likes.includes(user._id)
              ? post.likes.filter((id) => id !== user._id)
              : [...post.likes, user._id],
          }
        : post
    )
  );

  try {
    await axios.put(
      `/api/post/like/${postId}`,
      {},
      { headers: { token } }
    );
  } catch (error) {
    console.error("Like failed, reverting", error);

    // Rollback
    setFeedPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: post.likes.includes(user._id)
                ? post.likes.filter((id) => id !== user._id)
                : [...post.likes, user._id],
            }
          : post
      )
    );

    setUserPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: post.likes.includes(user._id)
                ? post.likes.filter((id) => id !== user._id)
                : [...post.likes, user._id],
            }
          : post
      )
    );
  }
};


  // Comment on post
const commentOnPost = async (postId, text) => {
  if (!text.trim() || !user?._id) return;

  // Optimistic update with text field included
  const optimisticComment = {
    _id: Date.now().toString(),
    text: text.trim(), // ✅ ADD THIS - the actual comment text
    userId: {
      _id: user._id,
      username: user.username,
      profilePic: user.profilePic,
    },
    createdAt: new Date(),
  };

  // Update user posts optimistically
  setUserPosts((prev) =>
    prev.map((post) =>
      post._id === postId
        ? { ...post, comments: [...post.comments, optimisticComment] }
        : post
    )
  );

  // Update feed posts optimistically
  setFeedPosts((prev) =>
    prev.map((post) =>
      post._id === postId
        ? { ...post, comments: [...post.comments, optimisticComment] }
        : post
    )
  );

  // API call
  try {
    const res = await axios.post(
      `/api/post/comment/${postId}`,
      { text },
      { headers: { token } }
    );

    // Replace optimistic data with real data from backend
    setUserPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, comments: res.data.comments }
          : post
      )
    );

    setFeedPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, comments: res.data.comments }
          : post
      )
    );
  } catch (error) {
    console.error("Comment error:", error);
    
    // Rollback optimistic update on error
    setUserPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { 
              ...post, 
              comments: post.comments.filter(c => c._id !== optimisticComment._id) 
            }
          : post
      )
    );

    setFeedPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { 
              ...post, 
              comments: post.comments.filter(c => c._id !== optimisticComment._id) 
            }
          : post
      )
    );
  }
};
  return (
    <PostContext.Provider
      value={{
        feedPosts,
        userPosts,
        loading,
        hasMore,
        fetchFeedPosts,
        fetchUserPosts,
        createPost,
        toggleLike,
        commentOnPost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => useContext(PostContext);
