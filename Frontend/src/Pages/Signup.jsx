import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setUser } from '../store/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // For demo purposes, we'll just simulate a signup
    // In a real app, you would make an API call here
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful signup
      dispatch(setUser({
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        profilePicture: null
      }));
      
      toast.success('Account created successfully!');
      // Redirect to profile setup page
      navigate('/profile-setup');
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-black bg-opacity-60 rounded-xl shadow-2xl overflow-hidden">
        {/* Left side - Blue-Purple Gradient Logo */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-black z-0"></div>
          
          {/* Vezzra Logo */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <img 
              src="/src/assets/vezzra-removebg-preview.png" 
              alt="Vezzra Logo" 
              className="w-64 h-64 mb-6 object-contain"
            />
            
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to Vartul</h2>
            <p className="text-gray-400 text-center max-w-xs">Join our community of creators and connect with like-minded individuals</p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/3 left-10 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
        </div>
        
        {/* Right side - Signup form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-black">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-3">Vartul</h1>
            <p className="text-gray-300 text-lg font-light">Join our community of creators and explorers</p>
          </div>
          
          <button className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 1.8c4.529 0 8.2 3.671 8.2 8.2 0 4.529-3.671 8.2-8.2 8.2-4.529 0-8.2-3.671-8.2-8.2 0-4.529 3.671-8.2 8.2-8.2zm-2 4.5v7.4l6-3.7-6-3.7z"></path>
            </svg>
            Continue with Facebook
          </button>
          
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-800"></div>
            <span className="px-4 text-gray-400 text-sm font-medium">OR</span>
            <div className="flex-grow h-px bg-gray-800"></div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300 block">Email or Mobile Number</label>
              <input
                id="email"
                type="text"
                name="email"
                placeholder="Enter your email or mobile number"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-gray-300 block">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full p-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300 block">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full p-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300 block">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div className="text-sm text-gray-400 mt-4">
              <p>By signing up, you agree to our <Link to="/terms" className="text-purple-400 hover:text-purple-300 font-medium">Terms of Service</Link> & <Link to="/privacy" className="text-purple-400 hover:text-purple-300 font-medium">Privacy Policy</Link>.</p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white shadow-lg ${
                loading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:translate-y-[-2px]'
              } transition-all duration-300`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Already have an account?<Link to="/auth?mode=login"  className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-purple-700 font-medium">Sign In</Link>
            </p>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm font-medium mb-3">Get the app</p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="transform hover:scale-105 transition-transform duration-300">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-10" />
              </a>
              <a href="#" className="transform hover:scale-105 transition-transform duration-300">
                <img src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" alt="Get it from Microsoft" className="h-10" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;