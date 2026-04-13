import React, { useState, useContext } from "react";
import { Usercontext } from "../Context/Usercontext";
import { useNavigate } from "react-router-dom";

const BasicInfo = () => {
  
  const navigate = useNavigate();

  const {completeprofile}=useContext(Usercontext)

  const [formData, setFormData] = useState({
    username: "",
    gender: "",
    ageGroup: "",
    bio: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await completeprofile(formData);
    if (res?.success) {
      navigate("/profile-setup/interests");
    }
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6 animate-fadeIn">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  User Name
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  placeholder="Enter your User Name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Age Group */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Age Group
                  </label>
                  <select
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  >
                    <option value="">Select Age Group</option>
                    <option value="teen">Teen (13-17)</option>
                    <option value="young-adult">Young Adult (18-24)</option>
                    <option value="adult">Adult (25+)</option>
                  </select>
                </div>
              </div>

              {/* bio */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about your bio..."
                  rows="3"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end mt-10">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transform hover:translate-y-[-2px] transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;