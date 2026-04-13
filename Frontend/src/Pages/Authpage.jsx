import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import { setUser } from '../store/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Usercontext } from '../Context/Usercontext';


const AuthPage = () => {
  // mode: 'signup' | 'login'
  const [mode, setMode] = useState('signup');
  const location = useLocation();
const params = new URLSearchParams(location.search);
const initialMode = params.get("mode") || "login";

  const [formData, setFormData] = useState({
   
    email: '',
    password: '',
    fullname: ''
  });
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {Login,authuser,Logout}=useContext(Usercontext)
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
 
    });
  };

  const toggleMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetForm();
  };


  //sending the api call
 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const { email, password, fullname } = formData;

  let credentials;

  if (mode === "signup") {
    credentials = { fullname, email, password };
  } else {
    credentials = { email, password };
  }

  const response = await Login({
    state: mode === "signup" ? "signup" : "login",
    credentials
  });

  setLoading(false);
  if (response?.success) {
    if (mode === "signup") {
      // console.log("navigating in signup")
      navigate("/profile-setup/basic-info");
    } else {
      // console.log("navigating in login")
    navigate("/");
    }
  }
};




  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-black bg-opacity-60 rounded-xl shadow-2xl overflow-hidden">
        {/* Left side - Logo & decorative (kept as in your signup page to preserve design) */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-black z-0"></div>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <img
              src="/src/assets/vezzra-removebg-preview.png"
              alt="Vezzra Logo"
              className="w-64 h-64 mb-6 object-contain"
            />

            {/* Change welcome text slightly based on mode but keep styles */}
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'signup' ? 'Welcome to Vartul' : 'Welcome back to Vartul'}
            </h2>

            <p className="text-gray-400 text-center max-w-xs">
              {mode === 'signup'
                ? 'Join our community of creators and connect with like-minded individuals'
                : 'Connect with friends and share your moments in a beautiful way'}
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/3 left-10 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl"></div>
        </div>

        {/* Right side - Form (shared for both signup & login) */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-black">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-3">Vartul</h1>
            <p className="text-gray-300 text-lg font-light">
              {mode === 'signup'
                ? 'Join our community of creators and explorers'
                : 'Sign in to connect with your network'}
            </p>
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

            {/* Signup-only fields */}
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="fullname" className="text-sm font-medium text-gray-300 block">Full Name</label>
                  <input
                    id="fullname"
                    type="text"
                    name="fullname"
                    placeholder="Enter your full name"
                    value={formData.fullname}
                    onChange={handleChange}
                    required={mode === 'signup'}
                    className="w-full p-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

               
              </>
            )}

            {/* Password field (present in both modes) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium text-gray-300 block">Password</label>
                {mode === 'login' && (
                  <a href="#" className="text-xs text-blue-400 hover:text-purple-400 transition-colors duration-300">Forgot password?</a>
                )}
              </div>
              <input
                id="password"
                type="password"
                name="password"
                placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {mode === 'signup' && (
              <div className="text-sm text-gray-400 mt-4">
                <p>By signing up, you agree to our <Link to="/terms" className="text-purple-400 hover:text-purple-300 font-medium">Terms of Service</Link> & <Link to="/privacy" className="text-purple-400 hover:text-purple-300 font-medium">Privacy Policy</Link>.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white shadow-lg ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:translate-y-[-2px]'
              } transition-all duration-300`}
            >
              {loading ? (mode === 'signup' ? 'Creating Account...' : 'Signing in...') : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-8 text-center">
            {mode === 'signup' ? (
              <p className="text-gray-300">
                Already have an account? <button onClick={() => {toggleMode('login'); navigate("/auth?mode=login");}
} className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-purple-700 font-medium">Sign In</button>
              </p>
            ) : (
              <p className="text-gray-300">
                Don't have an account? <button onClick={() =>{ toggleMode('signup');navigate("/auth?mode=signup");}} className="text-blue-400 hover:text-purple-400 transition-colors duration-300 font-medium">Create Account</button>
              </p>
            )}
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

export default AuthPage;
