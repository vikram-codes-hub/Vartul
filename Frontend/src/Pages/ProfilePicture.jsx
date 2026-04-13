import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Usercontext } from "../Context/Usercontext";

const ProfilePicture = () => {
  const [preview, setPreview] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { uploadProfilePicture, fetchuser, user } = useContext(Usercontext);

  // Convert image to base64
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result);
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const finish = async () => {
    if (!base64Image) return;

    setLoading(true);

    const res = await uploadProfilePicture(base64Image);

    if (res?.success) {
      await fetchuser();
      navigate("/profile");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-black bg-opacity-70 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
              Complete Your Profile
            </h1>
            <p className="text-gray-300 text-lg font-light">
              Tell us more about yourself to personalize your experience
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Profile Picture
              </label>

              <div className="flex flex-col items-center">
                <div className="w-32 h-32 mb-6 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden">
                  {preview ? (
                    <img
                      src={preview}
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-12 h-12 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>

                <label className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg cursor-pointer shadow-lg transition">
                  Choose Photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                  />
                </label>

                <p className="mt-4 text-sm text-gray-400">
                  Recommended: Square image, at least 400×400
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-10">
            <button
              onClick={finish}
              disabled={loading || !base64Image}
              className={`px-8 py-3 rounded-lg font-medium text-white shadow-lg ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              } transition`}
            >
              {loading ? "Saving..." : "Complete Setup"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePicture;
