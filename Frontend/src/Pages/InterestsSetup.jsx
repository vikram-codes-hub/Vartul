import React, { useState, useContext } from "react";
import { Usercontext } from "../Context/Usercontext";
import { useNavigate } from "react-router-dom";

const InterestsSetup = () => {
  const { updateUserInterests } = useContext(Usercontext);
  const navigate = useNavigate();

  const interestsList = [
    "Photography", "Travel", "Food", "Fashion", 
    "Sports", "Music", "Art", "Technology"
  ];

  const categoriesList = [
    "Entertainment", "Education", "News", "Lifestyle", 
    "Gaming", "Fitness", "Business"
  ];

  const [interests, setInterests] = useState([]);
  const [contentCategories, setContentCategories] = useState([]);

  const toggle = (item, list, setter) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = async () => {
    if (interests.length < 3) {
      alert("Select at least 3 interests");
      return;
    }

    const res = await updateUserInterests({ interests, contentCategories });
    if (res?.success) {
      navigate("/profile-setup/profile-picture");
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

          <div className="space-y-8 animate-fadeIn">
            {/* Interests */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interests (Select at least 3)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {interestsList.map((interest) => (
                  <div
                    key={interest}
                    className={`p-3 rounded-lg border ${
                      interests.includes(interest)
                        ? "border-purple-500 bg-purple-900 bg-opacity-20"
                        : "border-gray-700 bg-gray-800 hover:border-gray-500"
                    } cursor-pointer transition-all duration-300`}
                    onClick={() => toggle(interest, interests, setInterests)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`interest-${interest}`}
                        checked={interests.includes(interest)}
                        onChange={() => {}}
                        className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`interest-${interest}`}
                        className="ml-2 text-sm text-gray-300 font-medium"
                      >
                        {interest}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Categories */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preferred Content Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {categoriesList.map((category) => (
                  <div
                    key={category}
                    className={`p-3 rounded-lg border ${
                      contentCategories.includes(category)
                        ? "border-purple-500 bg-purple-900 bg-opacity-20"
                        : "border-gray-700 bg-gray-800 hover:border-gray-500"
                    } cursor-pointer transition-all duration-300`}
                    onClick={() => toggle(category, contentCategories, setContentCategories)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={contentCategories.includes(category)}
                        onChange={() => {}}
                        className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="ml-2 text-sm text-gray-300 font-medium"
                      >
                        {category}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-10">
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transform hover:translate-y-[-2px] transition-all duration-300"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestsSetup;