import axiosInstance from '../Utils/axiosInstance';

// ─────────────────────────────────────────
// FEED
// ─────────────────────────────────────────
export const fetchReels = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get(`/api/reels/feed?page=${page}&limit=${limit}`);
  return res.data; // { success, reels, meta }
};

// ─────────────────────────────────────────
// UPLOAD – multipart (streaming, preferred)
// ─────────────────────────────────────────
export const uploadReelMultipart = async (formData, onUploadProgress) => {
  const res = await axiosInstance.post('/api/reels/upload-multipart', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return res.data;
};

// UPLOAD – base64 (legacy fallback)
export const uploadReel = async ({ video, thumbnail, description, audioName, tags }) => {
  const res = await axiosInstance.post('/api/reels/upload', {
    video, thumbnail, description, audioName, tags,
  });
  return res.data;
};

// ─────────────────────────────────────────
// LIKE / UNLIKE
// ─────────────────────────────────────────
export const likeReel = async (reelId) => {
  const res = await axiosInstance.post(`/api/reels/${reelId}/like`);
  return res.data; // { success, liked, likesCount }
};

// ─────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────
export const getReelComments = async (reelId) => {
  const res = await axiosInstance.get(`/api/reels/${reelId}/comments`);
  return res.data; // { success, comments }
};

export const commentOnReel = async (reelId, text) => {
  const res = await axiosInstance.post(`/api/reels/${reelId}/comments`, { text });
  return res.data; // { success, comment, commentsCount }
};

// ─────────────────────────────────────────
// VIEW TRACKING
// ─────────────────────────────────────────
export const sendWatchData = async (reelId) => {
  try {
    await axiosInstance.post(`/api/reels/${reelId}/view`);
  } catch {
    // Silent – analytics shouldn't break UX
  }
};

// ─────────────────────────────────────────
// SHARE
// ─────────────────────────────────────────
export const shareReel = async (reelId) => {
  try {
    const res = await axiosInstance.post(`/api/reels/${reelId}/share`);
    return res.data; // { success, shares }
  } catch {
    // Silent fail
  }
};

// ─────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────
export const deleteReel = async (reelId) => {
  const res = await axiosInstance.delete(`/api/reels/${reelId}`);
  return res.data;
};
