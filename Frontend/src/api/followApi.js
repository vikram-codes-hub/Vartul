import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
export const followUserApi = (userId) =>
  axios.post(`/api/auth/${userId}/follow`);

export const unfollowUserApi = (userId) =>
  axios.post(`/api/auth/${userId}/unfollow`);

export const getFollowersApi = (userId, page = 1, limit = 20) =>
  axios.get(`/api/auth/${userId}/followers?page=${page}&limit=${limit}`);

export const getFollowingApi = (userId, page = 1, limit = 20) =>
  axios.get(`/api/auth/${userId}/following?page=${page}&limit=${limit}`);

export const checkFollowStatusApi = (userId) =>
  axios.get(`/api/auth/${userId}/follow-status`);
