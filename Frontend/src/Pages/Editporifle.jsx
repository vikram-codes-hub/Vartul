import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { Usercontext } from "../Context/Usercontext";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, setuser, token, uploadProfilePicture } = useContext(Usercontext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    bio: "",
    website: "",
  });
  const [previewPic, setPreviewPic] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  /* Pre-fill from context */
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        name: user.name || "",
        bio: user.bio || "",
        website: user.website || "",
      });
      setPreviewPic(user.profilePic || null);
    }
  }, [user]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* Profile pic – convert to base64 and upload immediately */
  const handlePicSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setPreviewPic(base64);
      setUploadingPic(true);
      const res = await uploadProfilePicture(base64);
      setUploadingPic(false);
      if (res?.success) {
        toast.success("Profile photo updated!");
      } else {
        toast.error("Failed to upload photo.");
      }
    };
    reader.readAsDataURL(file);
  };

  /* Save profile details */
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await axios.put(
        "/api/auth/update-profile",
        formData,
        { headers: { token } }
      );
      if (data.success) {
        setuser((prev) => ({ ...prev, ...formData }));
        toast.success("Profile updated!");
        navigate("/profile");
      } else {
        toast.error(data.message || "Update failed.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc =
    previewPic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || "U")}&background=6d28d9&color=fff`;

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-2xl px-5 py-10">
        {/* Page title */}
        <h1 className="text-xl font-semibold mb-8">Edit profile</h1>

        {/* ── Profile photo card ──────────────────────────────────── */}
        <div className="flex items-center justify-between bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarSrc}
                className="w-14 h-14 rounded-full object-cover"
                alt="profile"
              />
              {uploadingPic && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">{formData.username}</p>
              <p className="text-xs text-gray-400">{formData.name}</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <Camera size={14} />
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePicSelect}
          />
        </div>

        {/* ── Form fields ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {[
            { label: "Username", name: "username", type: "input", placeholder: "your_username" },
            { label: "Name", name: "name", type: "input", placeholder: "Your full name" },
            { label: "Website", name: "website", type: "input", placeholder: "https://yoursite.com" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-semibold mb-1.5 text-gray-300">{label}</label>
              <input
                type="text"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full bg-[#1a1a1a] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder-gray-600"
              />
            </div>
          ))}

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-300">Bio</label>
            <textarea
              name="bio"
              rows={4}
              maxLength={150}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell people about yourself..."
              className="w-full bg-[#1a1a1a] border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 resize-none text-sm outline-none transition-colors placeholder-gray-600"
            />
            <p className="text-right text-xs text-gray-500 mt-1">
              {formData.bio.length} / 150
            </p>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => navigate("/profile")}
            className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
