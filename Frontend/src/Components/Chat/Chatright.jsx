import React, { useContext, useState, useRef, useEffect } from 'react';
import { ChatContext } from '../../Context/Chat';
import { Usercontext } from '../../context/Usercontext';
import { IoCallOutline, IoArrowBack, IoImageOutline } from "react-icons/io5";
import { FaVideo, FaTrash } from "react-icons/fa";
import { toast } from 'react-hot-toast';

const Chatright = ({ isMobile }) => {
  const { user } = useContext(Usercontext);
  const { 
    selectedChat, setSelectedChat, messages, sendChatMessage, 
    removeMessage, loadingMessages, typingUsers, loadMoreMessages,
    sendTypingIndicator, messagesMeta 
  } = useContext(ChatContext);
  
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Infinite Scroll Trigger
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && messagesMeta.hasMore && !loadingMessages) {
       loadMoreMessages();
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    
    if (!isTyping && val.trim()) {
       setIsTyping(true);
       sendTypingIndicator(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
       setIsTyping(false);
       sendTypingIndicator(false);
    }, 2000);
  };

  if (!selectedChat) return null;

  const displayName = selectedChat.username || selectedChat.name || 'User';
  const avatar = selectedChat.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

  // Format timestamp nicely
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (e.g. max 10MB to avoid massive base64 strings right now, though backend supports 50m)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteMessage = (msgId) => {
    if (window.confirm("Delete this message for everyone?")) {
      removeMessage(msgId);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const payloadText = text.trim();
    if (!payloadText && !mediaPreview || sending) return;

    setSending(true);
    setText(''); 
    
    // Determine media type
    let imagePayload = null;
    let videoPayload = null;
    
    if (mediaFile && mediaPreview) {
      if (mediaFile.type.startsWith('image/')) {
        imagePayload = mediaPreview;
      } else if (mediaFile.type.startsWith('video/')) {
        videoPayload = mediaPreview;
      }
    }
    
    // Clear preview immediately for UX
    const cachedPreview = mediaPreview;
    clearMedia();
    setIsTyping(false);
    sendTypingIndicator(false);
    
    try {
      await sendChatMessage(payloadText, imagePayload, videoPayload); 
    } catch {
      setText(payloadText); 
      setMediaPreview(cachedPreview); // restore preview
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='bg-black border-l border-gray-800 flex-1 flex flex-col h-full w-full'>
      {/* Header */}
      <div className='flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-800 shrink-0'>
        <div className='flex items-center gap-3'>
          {isMobile && (
            <button onClick={() => setSelectedChat(null)} className="mr-1 text-white hover:bg-gray-800 p-2 rounded-full">
              <IoArrowBack className="w-6 h-6" />
            </button>
          )}
          <img 
            className='w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover cursor-pointer border border-white/10' 
            src={avatar} 
            alt={displayName} 
          />
          <div className="min-w-0">
            <p className='font-semibold text-white cursor-pointer truncate'>{displayName}</p>
            {typingUsers[selectedChat._id] ? (
               <p className='text-xs text-blue-400 font-medium animate-pulse'>Typing...</p>
            ) : (
               <p className='text-xs text-green-500 font-medium truncate'>Active now</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2 sm:gap-4 shrink-0'>
          <button className='p-2 hover:bg-gray-900 cursor-pointer rounded-full transition-colors'>
            <IoCallOutline className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </button>
          <button className='p-2 hover:bg-gray-900 cursor-pointer rounded-full transition-colors'>
            <FaVideo className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 scrollbar-hide"
      >
        {messagesMeta.hasMore && (
           <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
           </div>
        )}
        {loadingMessages && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-3 border-t-white border-white/20 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-500 gap-3">
             <img src={avatar} alt="Profile" className="w-24 h-24 rounded-full opacity-60" />
             <p className="font-semibold text-lg text-gray-300">{displayName}</p>
             <p className="text-sm">Say hi to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
            // The senderId can either be an object (populated via getMessages API) or a raw ID (if it came directly from Socket.io)
            const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;
            const senderAvatar = isMe ? (user.profilePic || `https://ui-avatars.com/api/?name=${user?.username}&background=3b82f6&color=fff`) : avatar;

            return (
              <div
                key={msg._id || i}
                className={`flex items-end gap-2 mb-4 group ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  <img
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover mb-1 shrink-0 bg-gray-800"
                    src={senderAvatar}
                    alt="P"
                  />
                )}
                
                <div className="flex flex-col">
                  {/* Media attachment if any */}
                  {msg.mediaUrl && (
                    <div className="mb-1 rounded-2xl overflow-hidden max-w-xs ring-1 ring-white/10">
                      {msg.messageType === 'video' ? (
                        <video src={msg.mediaUrl} controls className="max-h-64 object-cover" />
                      ) : (
                        <img src={msg.mediaUrl} alt="Attachment" className="max-h-64 object-cover" />
                      )}
                    </div>
                  )}
                  
                  {/* Text bubble */}
                  {msg.text && (
                    <div
                      className={`px-4 py-2.5 rounded-2xl max-w-[260px] sm:max-w-md break-words text-[15px] leading-snug ${
                        isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-[#262626] text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-gray-500">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isMe && (
                      <span className="flex">
                        {msg.isRead ? (
                          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.31 6.31a1 1 0 0 0-1.42 0l-10 10-4.59-4.59a1 1 0 0 0-1.41 1.41l5.3 5.3a1 1 0 0 0 1.41 0l10.71-10.71a1 1 0 0 0 0-1.41zM14.59 16.31l.7-.7 3.3 3.3a1 1 0 1 1-1.41 1.41l-2.59-2.59zM8.71 16.29l5.3-5.3a1 1 0 0 0-1.42-1.41l-5.3 5.3a1 1 0 0 0 1.42 1.41z"/>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.31 6.31a1 1 0 0 0-1.42 0l-10 10-4.59-4.59a1 1 0 0 0-1.41 1.41l5.3 5.3a1 1 0 0 0 1.41 0l10.71-10.71a1 1 0 0 0 0-1.41z"/>
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Delete button (only for sender) */}
                {isMe && (
                   <button 
                     onClick={() => handleDeleteMessage(msg._id)}
                     className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all flex-shrink-0"
                     title="Delete message"
                   >
                     <FaTrash className="w-3.5 h-3.5" />
                   </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview Area */}
      {mediaPreview && (
        <div className="px-4 sm:px-6 py-2 bg-[#181818] border-t border-gray-800 flex items-center gap-3 shrink-0">
          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-600">
             {mediaFile?.type.startsWith('video/') ? (
               <video src={mediaPreview} className="w-full h-full object-cover" />
             ) : (
               <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
             )}
             {/* Delete Preview Button */}
             <button 
                onClick={clearMedia}
                className="absolute top-0.5 right-0.5 bg-black/60 p-1 rounded-full text-white hover:bg-red-500 transition-colors"
                type="button"
             >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
          <p className="text-sm text-gray-400 truncate flex-1">{mediaFile.name}</p>
        </div>
      )}

      {/* Message Input Area */}
      <div className='px-4 sm:px-6 py-3 border-t border-gray-800 bg-black shrink-0 pb-safe'>
        <form onSubmit={handleSend} className='flex items-center gap-2 sm:gap-3 bg-[#181818] border border-gray-800 rounded-full px-2 sm:px-4 py-1.5 focus-within:ring-1 focus-within:ring-gray-600 focus-within:border-gray-600 transition-all'>
          {/* Emojis & Attachments */}
          <div className="flex gap-1 shrink-0">
            <button type="button" className='p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors'>
              <svg className='w-5 h-5 sm:w-6 sm:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/>
              </svg>
            </button>
            
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleMediaSelect}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className='p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors'
            >
              <IoImageOutline className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          <input 
            className='flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-[15px] min-w-0'
            type="text" 
            placeholder='Message...' 
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {text.trim() || mediaPreview ? (
            <button 
              type="submit" 
              disabled={sending}
              className='p-1.5 text-blue-500 hover:text-blue-400 font-semibold shrink-0 disabled:opacity-50 transition-colors'
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          ) : (
            <div className="flex shrink-0">
               <button type="button" className='p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors'>
                 <svg className='w-5 h-5 sm:w-6 sm:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                   <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/>
                 </svg>
               </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Chatright;