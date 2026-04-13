import axios from "../utils/axiosInstance";

// Upload story
export const uploadStoryApi = (formData) => {
  return axios.post("/api/story/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


// Get stories feed (home)
export const getStoriesFeedApi = () => {
  return axios.get("/api/story/feed");
};

// Get my stories
export const getMyStoriesApi = () => {
  return axios.get("/api/story/me");
};

// Get specific user's stories
export const getUserStoriesApi = (userId) => {
  return axios.get(`/api/story/user/${userId}`);
};

// View a story
export const viewStoryApi = (storyId) => {
  return axios.post(`/api/story/view/${storyId}`);
};

// Get viewers (owner only)
export const getStoryViewersApi = (storyId) => {
  return axios.get(`/api/story/viewers/${storyId}`);
};

// Delete story
export const deleteStoryApi = (storyId) => {
  return axios.delete(`/api/story/${storyId}`);
};
