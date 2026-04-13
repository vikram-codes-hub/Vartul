import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, ChevronDown, ArrowLeft, Trash2, ImageIcon } from 'lucide-react';
import { ChatContext } from '../../Context/Chat';
import { Usercontext } from '../../context/Usercontext';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const timeAgo = (date) => {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const Avatar = ({ src, name, size = 'md', online = false }) => {
  const sz = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=6d28d9&color=fff&size=64`;
  return (
    <div className={`relative flex-shrink-0 ${sz}`}>
      <img
        src={src || fallback}
        alt={name}
        className={`${sz} rounded-full object-cover border border-white/10`}
        onError={(e) => { e.target.src = fallback; }}
      />
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0f0f0f]" />
      )}
    </div>
  );
};

/* ── Floating Chat Bar ────────────────────────────────────────────────────── */
const FloatingChatBar = () => {
  const {
    chatUsers, unseenMap, selectedChat, setSelectedChat,
    messages, loadingMessages, sendChatMessage,
    typingUsers, sendTypingIndicator, loadMoreMessages, messagesMeta
  } = useContext(ChatContext);
  const { user, onlineuser } = useContext(Usercontext);

  const [open, setOpen] = useState(false);          // panel open/close
  const [view, setView] = useState('list');          // 'list' | 'chat'
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Total unread count across all conversations
  const totalUnread = Object.values(unseenMap).reduce((a, b) => a + b, 0);

  // Last sender avatar for bubble
  const lastSender = chatUsers[0];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (view === 'chat') {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  // Open chat for a user
  const openChat = (chatUser) => {
    setSelectedChat(chatUser);
    setView('chat');
  };

  // Back to list
  const goBack = () => {
    setView('list');
    setSelectedChat(null);
  };

  // Toggle panel
  const togglePanel = () => {
    setOpen(prev => !prev);
    if (!open) setView('list');
  };

  // Handle send
  const handleSend = async () => {
    if (!text.trim() || sending || !selectedChat) return;
    const msg = text.trim();
    setText('');
    setSending(true);
    try {
      sendTypingIndicator(false);
      await sendChatMessage(msg, null, null);
    } catch {}
    setSending(false);
    inputRef.current?.focus();
  };

  // Typing indicator with debounce
  const handleTyping = (e) => {
    setText(e.target.value);
    sendTypingIndicator(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(false), 1500);
  };

  const isOnline = (userId) => onlineuser?.includes(userId);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">

      {/* ── Expanded Panel ──────────────────────────────────────────────── */}
      <div
        className={`
          w-[360px] bg-[#0f0f0f]/95 backdrop-blur-xl
          border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/20
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out origin-bottom-right
          ${open
            ? 'opacity-100 scale-100 translate-y-0 max-h-[520px]'
            : 'opacity-0 scale-95 translate-y-4 max-h-0 pointer-events-none'
          }
        `}
      >
        {/* ── Panel Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-gradient-to-r from-purple-900/30 to-indigo-900/20 flex-shrink-0">
          {view === 'chat' ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={goBack} className="text-gray-400 hover:text-white transition p-1">
                <ArrowLeft size={18} />
              </button>
              <Avatar
                src={selectedChat?.profilePic}
                name={selectedChat?.username}
                size="sm"
                online={isOnline(selectedChat?._id)}
              />
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{selectedChat?.username}</p>
                <p className="text-xs text-gray-400">
                  {typingUsers[selectedChat?._id]
                    ? <span className="text-purple-400 animate-pulse">Typing…</span>
                    : isOnline(selectedChat?._id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-purple-400" />
              <span className="text-white font-bold text-sm">Messages</span>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
          )}
          <button onClick={togglePanel} className="text-gray-400 hover:text-white transition p-1 ml-2 flex-shrink-0">
            <ChevronDown size={18} />
          </button>
        </div>

        {/* ── Conversation List ────────────────────────────────────────── */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {chatUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm gap-2">
                <MessageCircle size={32} className="text-gray-700" />
                <p>No messages yet</p>
              </div>
            ) : (
              chatUsers.map((chatUser) => {
                const unread = unseenMap[chatUser._id] || 0;
                const isTyping = typingUsers[chatUser._id];
                return (
                  <button
                    key={chatUser._id}
                    onClick={() => openChat(chatUser)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group text-left"
                  >
                    <Avatar
                      src={chatUser.profilePic}
                      name={chatUser.username}
                      size="md"
                      online={isOnline(chatUser._id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>
                          {chatUser.username}
                        </p>
                        <span className="text-[10px] text-gray-600 flex-shrink-0 ml-1">
                          {timeAgo(chatUser.lastMessageAt)}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${
                        isTyping ? 'text-purple-400 animate-pulse font-medium'
                        : unread > 0 ? 'text-gray-300 font-semibold'
                        : 'text-gray-500'
                      }`}>
                        {isTyping ? 'Typing…' : (chatUser.lastMessage || 'Say hi!')}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ── Active Chat Messages ─────────────────────────────────────── */}
        {view === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-2 min-h-0">
              {/* Load more */}
              {messagesMeta?.hasMore && (
                <button onClick={loadMoreMessages} className="text-xs text-gray-500 hover:text-gray-300 text-center py-1 transition">
                  Load older messages
                </button>
              )}
              {loadingMessages && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      max-w-[70%] rounded-2xl px-3 py-2 text-sm
                      ${isMine
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm'
                        : 'bg-white/10 text-gray-100 rounded-bl-sm'
                      }
                      ${msg.isOptimistic ? 'opacity-70' : ''}
                    `}>
                      {msg.mediaUrl && msg.messageType === 'image' && (
                        <img src={msg.mediaUrl} alt="" className="rounded-lg max-w-full mb-1" />
                      )}
                      {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-purple-200' : 'text-gray-500'} text-right`}>
                        {timeAgo(msg.createdAt)}
                        {isMine && msg.isRead && <span className="ml-1 text-blue-300">✓✓</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Typing indicator bubble */}
              {typingUsers[selectedChat?._id] && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* ── Message Input ──────────────────────────────────────── */}
            <div className="flex-shrink-0 px-3 py-2.5 border-t border-white/8 flex items-end gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={handleTyping}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message…"
                className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none transition"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                  text.trim() && !sending
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Floating Bubble Bar ──────────────────────────────────────────────── */}
      <button
        onClick={togglePanel}
        className="
          group flex items-center gap-3 px-4 py-3
          bg-[#0f0f0f]/90 backdrop-blur-xl
          border border-white/10 rounded-2xl
          shadow-xl shadow-purple-900/30
          hover:border-purple-500/40 hover:shadow-purple-900/40
          transition-all duration-200 active:scale-95
        "
      >
        {/* Chat icon */}
        <div className="relative">
          <MessageCircle size={22} className="text-purple-400 group-hover:text-purple-300 transition" />
          {totalUnread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </div>

        {/* Label */}
        <span className="text-white text-sm font-semibold hidden sm:block">Messages</span>

        {/* Last sender avatar */}
        {lastSender && (
          <Avatar
            src={lastSender.profilePic}
            name={lastSender.username}
            size="sm"
            online={isOnline(lastSender._id)}
          />
        )}
      </button>
    </div>
  );
};

export default FloatingChatBar;
