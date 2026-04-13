import React, { useState, useEffect, useRef } from 'react';

const formatTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const CommentsPanel = ({ isOpen, onClose, reelId, initialComments = [], onComment }) => {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync comments when panel opens with fresh data
  useEffect(() => {
    if (isOpen) {
      setComments(initialComments);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, initialComments]);

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');
    try {
      const newComment = await onComment(reelId, trimmed);
      if (newComment) {
        setComments(prev => [...prev, newComment]);
      }
    } catch {
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Slide-up panel */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-50 bg-[#111] rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out flex flex-col`}
        style={{
          maxHeight: '75vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <h3 className="text-white font-semibold text-base">
            Comments {comments.length > 0 && <span className="text-gray-400 text-sm font-normal">({comments.length})</span>}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map((c, i) => (
              <div key={c._id || i} className="flex items-start gap-3">
                <img
                  src={c.userId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userId?.username || 'U')}&background=6366f1&color=fff`}
                  alt={c.userId?.username}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-sm font-semibold truncate">
                      {c.userId?.username || 'user'}
                    </span>
                    <span className="text-gray-500 text-xs shrink-0">
                      {formatTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-200 text-sm leading-snug mt-0.5 break-words">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 py-3 border-t border-white/10 bg-[#111] shrink-0 pb-safe"
        >
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 bg-white/10 text-white placeholder-gray-500 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 active:scale-95"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default CommentsPanel;
