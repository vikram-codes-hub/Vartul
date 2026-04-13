import axiosInstance from '../Utils/axiosInstance';

export const getChatUsers = async () => {
  const res = await axiosInstance.get('/api/messages/users');
  return res.data; // { success, users, unseenMessages }
};

export const getMessages = async (userId, page = 1, limit = 50) => {
  const res = await axiosInstance.get(`/api/messages/messages/${userId}?page=${page}&limit=${limit}`);
  return res.data; // { success, messages, meta }
};

export const sendMessage = async (userId, data) => {
  // data can be { text, image, video }
  const res = await axiosInstance.post(`/api/messages/send/${userId}`, data);
  return res.data; // { success, message }
};

export const deleteMessage = async (messageId) => {
  const res = await axiosInstance.delete(`/api/messages/delete/message/${messageId}`);
  return res.data; // { success, message }
};

export const deleteConversation = async (userId) => {
  const res = await axiosInstance.delete(`/api/messages/delete/conversation/${userId}`);
  return res.data; // { success, message }
};

export const initiateConversation = async (userId) => {
  const res = await axiosInstance.post(`/api/messages/start/${userId}`);
  return res.data; // { success, conversation }
};
