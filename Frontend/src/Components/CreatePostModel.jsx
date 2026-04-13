import { useRef, useState } from "react";
import { usePost } from "../Context/PostContext";

const CreatePostModal = ({ open, onClose }) => {
  const fileRef = useRef(null);
  const { createPost } = usePost();

  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!open) return null;

  // ==============================
  // FILE SELECT
  // ==============================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaType(file.type.startsWith("video") ? "video" : "image");

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ==============================
  // DRAG & DROP
  // ==============================
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setMediaType(file.type.startsWith("video") ? "video" : "image");

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ==============================
  // SHARE POST
  // ==============================
  const handleShare = async () => {
    if (!preview) return;

    try {
      setLoading(true);
      await createPost({ caption, media: preview, mediaType });
      onClose();
      // Reset state
      setPreview(null);
      setCaption("");
      setMediaType("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // GO BACK
  // ==============================
  const handleBack = () => {
    setPreview(null);
    setCaption("");
    setMediaType("");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[#262626] w-full max-w-[850px] mx-4 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700/50">
          <div className="w-8">
            {preview && (
              <button 
                onClick={handleBack}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          
          <span className="text-white font-semibold text-base">Create new post</span>
          
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-300 transition-colors w-8 flex justify-end"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        {!preview ? (
          <div 
            className={`h-[520px] flex flex-col items-center justify-center text-white transition-colors ${
              dragActive ? "bg-gray-700/50" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Camera Icon SVG */}
            <svg 
              className="w-24 h-24 mb-4 text-white/90" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 96 96"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M69.5 21h-4.15l-3.85-6.4a4 4 0 00-3.42-1.93H38.92a4 4 0 00-3.42 1.93L31.65 21H26.5a9 9 0 00-9 9v36a9 9 0 009 9h43a9 9 0 009-9V30a9 9 0 00-9-9zM48 61.83a13.83 13.83 0 1113.83-13.83A13.85 13.85 0 0148 61.83z"
              />
            </svg>

            <p className="text-xl mb-6 font-light">Drag photos and videos here</p>

            <button
              onClick={() => fileRef.current.click()}
              className="bg-[#0095f6] hover:bg-[#1877f2] px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              Select from computer
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex h-[520px]">
            {/* PREVIEW */}
            <div className="flex-1 bg-black flex items-center justify-center relative">
              {mediaType === "image" ? (
                <img 
                  src={preview} 
                  className="max-h-full max-w-full object-contain" 
                  alt="Preview"
                />
              ) : (
                <video 
                  src={preview} 
                  controls 
                  className="max-h-full max-w-full"
                />
              )}
            </div>

            {/* CAPTION SECTION */}
            <div className="w-[340px] flex flex-col border-l border-gray-700/50">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-[#262626] flex items-center justify-center text-xs">
                    👤
                  </div>
                </div>
                <span className="text-white text-sm font-semibold">vikram</span>
              </div>

              {/* Caption textarea */}
              <div className="flex-1 p-4">
                <textarea
                  placeholder="Write a caption..."
                  className="w-full h-32 bg-transparent text-white text-sm resize-none outline-none placeholder-gray-500"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {caption.length}/2,200
                </div>
              </div>

              {/* Emoji & Location options */}
              <div className="px-4 py-2 space-y-3 border-t border-gray-700/50">
                <button className="flex items-center justify-between w-full text-white hover:bg-white/5 p-2 rounded transition-colors">
                  <span className="text-sm">Add emoji</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                <button className="flex items-center justify-between w-full text-white hover:bg-white/5 p-2 rounded transition-colors">
                  <span className="text-sm">Add location</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Share button */}
              <div className="p-4 border-t border-gray-700/50">
                <button
                  onClick={handleShare}
                  disabled={loading || !preview}
                  className="w-full bg-[#0095f6] hover:bg-[#1877f2] disabled:bg-[#0095f6]/30 disabled:cursor-not-allowed py-2 rounded-lg font-semibold text-sm text-white transition-colors"
                >
                  {loading ? "Sharing..." : "Share"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;