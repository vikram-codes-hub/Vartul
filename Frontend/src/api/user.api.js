import axiosInstance from '../Utils/axiosInstance';

/**
 * Search users by key (username, name)
 * Backend Route: GET /api/auth/search/:key
 */
export const searchUsers = async (key) => {
  if (!key || key.trim() === '') return [];
  try {
    const response = await axiosInstance.get(`/api/auth/search/${encodeURIComponent(key)}`);
    return response.data.user || [];
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};
