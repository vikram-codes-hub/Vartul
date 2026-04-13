import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../store/authSlice';
import { toast } from 'react-toastify';

const ProfileSetup = () => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    ageGroup: '',
    interests: [],
    hobbies: '',
    contentCategories: []
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const interestOptions = ['Photography', 'Travel', 'Food', 'Fashion', 'Sports', 'Music', 'Art', 'Technology'];
  const contentCategoryOptions = ['Entertainment', 'Education', 'News', 'Lifestyle', 'Gaming', 'Fitness', 'Business'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e, category) => {
    const { name, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        [name]: [...formData[name], category]
      });
    } else {
      setFormData({
        ...formData,
        [name]: formData[name].filter(item => item !== category)
      });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user profile
      dispatch(setUser({
        ...formData,
        profileComplete: true
      }));
      
      toast.success('Profile setup completed!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Only proceed to next step if current step is valid
    if (step === 1) {
      // Basic info validation
      if (!formData.name || !formData.gender || !formData.ageGroup) {
        toast.error('Please fill in all required fields');
        return;
      }
      setStep(2);
    } 
    else if (step === 2) {
      // Interest validation - require at least 3 interests
      if (formData.interests.length < 3) {
        toast.error('Please select at least 3 interests');
        return;
      }
      // Proceed to profile picture step
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-black bg-opacity-70 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">Complete Your Profile</h1>
            <p className="text-gray-300 text-lg font-light">Tell us more about yourself to personalize your experience</p>
          </div>
          
          {/* Progress indicator */}
          <div className="mb-10">
            <div className="flex justify-between">
              <div className={`text-sm font-medium ${step >= 1 ? 'text-purple-400' : 'text-gray-500'}`}>Basic Info</div>
              <div className={`text-sm font-medium ${step >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>Interests</div>
              <div className={`text-sm font-medium ${step >= 3 ? 'text-purple-400' : 'text-gray-500'}`}>Profile Picture</div>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Gender</label>
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
                    <label className="block text-sm font-medium text-gray-300">Age Group</label>
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
                
                {/* Hobbies */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Hobbies</label>
                  <textarea
                    name="hobbies"
                    value={formData.hobbies}
                    onChange={handleChange}
                    placeholder="Tell us about your hobbies..."
                    rows="3"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  ></textarea>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Interests */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Interests (Select at least 3)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {interestOptions.map(interest => (
                      <div 
                        key={interest} 
                        className={`p-3 rounded-lg border ${
                          formData.interests.includes(interest) 
                            ? 'border-purple-500 bg-purple-900 bg-opacity-20' 
                            : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                        } cursor-pointer transition-all duration-300`}
                        onClick={() => handleCheckboxChange(
                          { target: { name: 'interests', checked: !formData.interests.includes(interest) }}, 
                          interest
                        )}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`interest-${interest}`}
                            name="interests"
                            checked={formData.interests.includes(interest)}
                            onChange={(e) => handleCheckboxChange(e, interest)}
                            className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                          />
                          <label htmlFor={`interest-${interest}`} className="ml-2 text-sm text-gray-300 font-medium">
                            {interest}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Content Categories */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Content Categories</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {contentCategoryOptions.map(category => (
                      <div 
                        key={category} 
                        className={`p-3 rounded-lg border ${
                          formData.contentCategories.includes(category) 
                            ? 'border-purple-500 bg-purple-900 bg-opacity-20' 
                            : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                        } cursor-pointer transition-all duration-300`}
                        onClick={() => handleCheckboxChange(
                          { target: { name: 'contentCategories', checked: !formData.contentCategories.includes(category) }}, 
                          category
                        )}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`category-${category}`}
                            name="contentCategories"
                            checked={formData.contentCategories.includes(category)}
                            onChange={(e) => handleCheckboxChange(e, category)}
                            className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                          />
                          <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-300 font-medium">
                            {category}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Profile Picture Upload - Simplified for demo */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-300 mb-4">Profile Picture</label>
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className="w-32 h-32 mb-6 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden">
                      <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    
                    <label className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg cursor-pointer shadow-lg transform hover:translate-y-[-2px] transition-all duration-300">
                      Choose Photo
                      <input type="file" className="hidden" />
                    </label>
                    
                    <p className="mt-4 text-sm text-gray-400">Recommended: Square image, at least 400x400 pixels</p>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-300 mb-4">Almost done! Click "Complete Setup" to finish your profile.</p>
                </div>
              </div>
            )}
            
            <div className={`flex ${step === 1 ? 'justify-end' : 'justify-between'} mt-10`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg shadow-md transition-all duration-300"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transform hover:translate-y-[-2px] transition-all duration-300"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 rounded-lg font-medium text-white shadow-lg ${
                    loading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transform hover:translate-y-[-2px]'
                  } transition-all duration-300`}
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;