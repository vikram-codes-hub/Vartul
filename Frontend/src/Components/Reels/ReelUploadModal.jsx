import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { uploadReelMultipart } from '../../api/reels.api';

const ReelUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnailSrc, setThumbnailSrc] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [audioName, setAudioName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const videoElRef = useRef(null);

  if (!isOpen) return null;

  // ── Auto-generate thumbnail by seeking canvas on video metadata load ─────
  const captureThumbnail = (videoEl) => {
    videoEl.currentTime = 0.5;
    videoEl.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth || 720;
        canvas.height = videoEl.videoHeight || 1280;
        canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        setThumbnailSrc(canvas.toDataURL('image/jpeg', 0.8));
      } catch {/* cross-origin – fine */}
    };
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error('Video must be under 200 MB');
      return;
    }
    setVideoFile(file);
    const objUrl = URL.createObjectURL(file);
    setVideoPreview(objUrl);
    // auto-capture thumbnail
    const tempVid = document.createElement('video');
    tempVid.src = objUrl;
    tempVid.muted = true;
    tempVid.onloadedmetadata = () => captureThumbnail(tempVid);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) { toast.error('Please select a video'); return; }
    setLoading(true);
    setUploadProgress(0);

    try {
      const tags = tagsInput
        .split(/[\s,#]+/)
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('description', description);
      formData.append('audioName', audioName || `Original Audio`);
      formData.append('tags', JSON.stringify(tags));

      const data = await uploadReelMultipart(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setUploadProgress(pct);
      });

      if (data.success) {
        toast.success('Reel uploaded! 🎬');
        onSuccess?.(data.reel);
        handleClose();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setVideoFile(null);
    setVideoPreview('');
    setThumbnailSrc('');
    setDescription('');
    setTagsInput('');
    setAudioName('');
    setUploadProgress(0);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && !loading && handleClose()}
    >
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold tracking-tight">Upload Reel</h2>
          <button onClick={handleClose} disabled={loading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Video picker */}
          {!videoPreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-all">
                <svg className="w-7 h-7 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-200">Select Video</p>
                <p className="text-xs text-gray-500 mt-1">MP4, MOV, WEBM · Max 200 MB</p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                ref={videoElRef}
                src={videoPreview}
                className="w-full max-h-52 object-contain"
                controls
              />
              {/* File info bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between text-xs text-gray-300">
                <span className="truncate max-w-[200px]">{videoFile?.name}</span>
                <span className="shrink-0 ml-2 text-gray-400">{formatBytes(videoFile?.size || 0)}</span>
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => { setVideoFile(null); setVideoPreview(''); setThumbnailSrc(''); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

          {/* Thumbnail preview */}
          {thumbnailSrc && (
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
              <img src={thumbnailSrc} alt="thumbnail" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              <span className="text-xs text-gray-400">Thumbnail auto-generated ✓</span>
            </div>
          )}

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Write a caption..."
              maxLength={2200}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-500 text-white resize-none outline-none focus:border-blue-500 transition-all"
            />
            <div className="text-right text-[10px] text-gray-600 mt-1">{description.length}/2200</div>
          </div>

          {/* Audio name */}
          <input
            value={audioName}
            onChange={e => setAudioName(e.target.value)}
            placeholder="Audio name (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-500 text-white outline-none focus:border-blue-500 transition-all"
          />

          {/* Tags */}
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="#trending #vartul"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-500 text-white outline-none focus:border-blue-500 transition-all"
          />

          {/* Upload progress */}
          {loading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{uploadProgress < 100 ? 'Uploading...' : 'Processing...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !videoFile}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Post Reel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReelUploadModal;
