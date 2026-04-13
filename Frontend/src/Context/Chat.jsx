import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Usercontext } from '../context/Usercontext';
import { getChatUsers, getMessages, sendMessage, deleteMessage, deleteConversation, initiateConversation } from '../api/chat.api';

export const ChatContext = createContext();

const ChatContextProvider = ({ children }) => {
  const { user, socket } = useContext(Usercontext);

  const [selectedChat, setSelectedChat] = useState(null); // The user we are chatting with
  const [chatUsers, setChatUsers] = useState([]); // List for sidebar
  const [unseenMap, setUnseenMap] = useState({}); // Mapping from userId to unread count
  const [messages, setMessages] = useState([]); // Array of current chat messages
  const [messagesMeta, setMessagesMeta] = useState({ page: 1, hasMore: false });
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { [userId]: true }

  // ── 1. Fetch Chat Users (Sidebar) ──────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const data = await getChatUsers();
      if (data.success) {
        setChatUsers(data.users || []);
        setUnseenMap(data.unseenMessages || {});
      }
    } catch (err) {
      console.error("Failed to fetch chat users", err);
    } finally {
      setLoadingChats(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // ── 2. Fetch Messages when selectedChat changes ─────────────────────────────────────
  const fetchActiveMessages = useCallback(async (page = 1) => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const data = await getMessages(selectedChat._id, page);
      if (data.success) {
        if (page === 1) {
          setMessages(data.messages);
        } else {
          // Prevent duplicates if messages were already fetched or arrived via socket
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m._id));
            const newMessages = data.messages.filter(m => !existingIds.has(m._id));
            return [...newMessages, ...prev]; // Prepend for infinite scroll
          });
        }
        setMessagesMeta(data.meta);
        
        // ── Read notification ────────────────────────────────────────────────────────
        if (data.messages.length > 0) {
           markAsRead();
        }
        setUnseenMap(prev => ({ ...prev, [selectedChat._id]: 0 }));
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    fetchActiveMessages(1);
  }, [selectedChat, fetchActiveMessages]);

  const loadMoreMessages = () => {
    if (messagesMeta.hasMore && !loadingMessages) {
      fetchActiveMessages(messagesMeta.page + 1);
    }
  };

  // ── 2.5 Auto-persist new chats from search ────────────────────────────────────────
  useEffect(() => {
    if (selectedChat && !loadingChats) { // wait for initial load, even if 0 chats
      const exists = chatUsers.find((u) => u._id === selectedChat._id);
      if (!exists) {
        // Optimistically add to top of sidebar
        setChatUsers(prev => {
          if (prev.find(u => u._id === selectedChat._id)) return prev;
          return [{
            ...selectedChat,
            lastMessage: '',
            lastMessageAt: new Date().toISOString()
          }, ...prev];
        });
        
        // Notify backend to create an actual conversational thread document to persist
        initiateConversation(selectedChat._id).catch(err => {
          console.error("Failed to persist conversation", err);
        });
      }
    }
  }, [selectedChat, loadingChats, chatUsers]);

  // ── 3. Send Message ───────────────────────────────────────────────────────────────
  const sendChatMessage = async (text, image, video) => {
    if (!selectedChat) return;
    
    // Create an optimistic message object to display instantly
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: optimisticId,
      senderId: user, // full user object for UI rendering
      receiverId: selectedChat._id,
      text: text,
      mediaUrl: image || video, 
      messageType: video ? 'video' : (image ? 'image' : 'text'),
      createdAt: new Date().toISOString(),
      isOptimistic: true 
    };

    // 1. Optimistically append message to chat
    setMessages(prev => [...prev, optimisticMessage]);

    // 1.5 Optimistically update sidebar list
    setChatUsers(prev => {
      const filtered = prev.filter(u => u._id !== selectedChat._id);
      const updatedUser = { 
        ...selectedChat, 
        lastMessage: text || (image ? 'Image' : 'Video'),
        lastMessageAt: new Date().toISOString() 
      };
      return [updatedUser, ...filtered];
    });

    try {
      // 2. Send to backend
      const data = await sendMessage(selectedChat._id, { text, image, video });
      if (data.success) {
        // 3. Replace the optimistic message with the real one from DB (which has the real _id and Cloudinary URL)
        setMessages(prev => prev.map(msg => msg._id === optimisticId ? data.message : msg));
        
        // Refresh sidebar to ensure they are at the top and listed.
        fetchChats();
      }
      return data;
    } catch (err) {
      console.error("Failed to send message", err);
      // 4. Revert optimistic UI on failure
      setMessages(prev => prev.filter(msg => msg._id !== optimisticId));
      throw err;
    }
  };

  const removeMessage = async (messageId) => {
    try {
      const data = await deleteMessage(messageId);
      if (data.success) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const removeConversation = async (userId) => {
    try {
      const data = await deleteConversation(userId);
      if (data.success) {
        setChatUsers(prev => prev.filter(u => u._id !== userId));
        if (selectedChat?._id === userId) {
          setSelectedChat(null);
        }
      }
    } catch (err) {
       console.error("Failed to delete conversation", err);
    }
  };

  // ── 3.5 Real-time Indicators & Read Notify ────────────────────────────────────────
  const sendTypingIndicator = (isTyping) => {
    if (!socket || !selectedChat) return;
    socket.emit(isTyping ? "typing" : "stopTyping", { receiverId: selectedChat._id });
  };

  const markAsRead = useCallback(() => {
    if (!socket || !selectedChat || !user) return;
    socket.emit("markAsRead", { 
       conversationId: messages.length > 0 ? messages[0].conversationId : null,
       senderId: selectedChat._id 
    });
  }, [socket, selectedChat, user, messages]);

  // ── 4. Socket.io Real-Time Listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Is this message for the currently opened chat?
      if (selectedChat && (newMessage.senderId === selectedChat._id || newMessage.receiverId === selectedChat._id)) {
        setMessages(prev => {
          // Prevent duplicates if optimistic UI already added it
          if (prev.some(m => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
        // Automatically mark as read if chat is open
        if (newMessage.senderId === selectedChat._id) {
           markAsRead();
        }
      } else {
        // Not active chat, update unread count
        setUnseenMap(prev => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
        }));
      }
      
      // Update sidebar sorting/last message
      fetchChats(); 
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleConversationDeleted = ({ userId }) => {
      setChatUsers(prev => prev.filter(u => u._id !== userId));
      if (selectedChat?._id === userId) {
        setSelectedChat(null);
      }
    };

    const handleUserTyping = ({ userId }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: true }));
    };

    const handleUserStoppedTyping = ({ userId }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };

    const handleMessagesRead = ({ conversationId, readerId }) => {
       // If the receiver read OUR messages, update local state to show double blue ticks
       if (selectedChat?._id === readerId) {
          setMessages(prev => prev.map(msg => msg.senderId === user?._id ? { ...msg, isRead: true } : msg));
       }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("conversationDeleted", handleConversationDeleted);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("conversationDeleted", handleConversationDeleted);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, selectedChat, fetchChats, markAsRead, user]);

  const value = {
    selectedChat,
    setSelectedChat,
    chatUsers,
    unseenMap,
    messages,
    loadingChats,
    loadingMessages,
    typingUsers,
    messagesMeta,
    loadMoreMessages,
    sendChatMessage,
    removeMessage,
    removeConversation,
    sendTypingIndicator
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContextProvider;