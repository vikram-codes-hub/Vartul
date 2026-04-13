import React, { useContext, useState } from 'react'
import { Settings } from 'lucide-react'
import SettingsModal from './Settingmodel';
import { useNavigate } from 'react-router-dom';
import { Usercontext } from '../../Context/Usercontext';
const Hero = () => {

  const navigate=useNavigate()
      const [isSettingsOpen, setIsSettingsOpen] = useState(false);

      const {fetchuser}=useContext(Usercontext)
  return (
    <div className="w-full bg-black min-h-screen text-white">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-12">
        <div className="flex items-start gap-8 md:gap-24">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 md:p-1">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400" 
                className="w-full h-full rounded-full object-cover border-2 md:border-4 border-black" 
                alt="Profile" 
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            {/* Username and Buttons */}
            <div className="flex items-center gap-3 md:gap-5 mb-5">
              <h1 className="text-lg md:text-xl font-light">Demo 1</h1>
              <button  onClick={() => navigate("/edit-profile")} className="bg-gray-700 hover:bg-gray-600 px-3 md:px-6 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition">
                Edit profile
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 px-3 md:px-6 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition">
                View archive
              </button>
             <button 
                className="hover:opacity-70 transition"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings size={24} />
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-5">
              <div>
                <span className="font-semibold">3</span>
                <span className="text-gray-400 ml-1">posts</span>
              </div>
              <div>
                <span className="font-semibold">280</span>
                <span className="text-gray-400 ml-1">followers</span>
              </div>
              <div>
                <span className="font-semibold">262</span>
                <span className="text-gray-400 ml-1">following</span>
              </div>
            </div>

            {/* Name and Bio */}
            <div>
              <p className="font-semibold mb-1">Demo 1</p>
              <p className="text-sm">Jai shree ram 💗 💗</p>
              <p className="text-sm">Sc 🤷: Demo.12021</p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Highlights */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-8">
        <div className="flex gap-12 overflow-x-auto">
          {/* Highlight 1 */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-600 to-gray-700 p-0.5">
              <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-2xl font-bold">♂️</span>
              </div>
            </div>
            <span className="text-xs mt-2">F💗</span>
          </div>

          {/* Highlight 2 */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-600 to-gray-700 p-0.5">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" 
                className="w-full h-full rounded-full object-cover"
                alt="Highlight" 
              />
            </div>
            <span className="text-xs mt-2">me💗</span>
          </div>

          {/* Add New Highlight */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-gray-700 flex items-center justify-center hover:border-gray-500 transition cursor-pointer">
              <span className="text-4xl text-gray-500">+</span>
            </div>
            <span className="text-xs mt-2">New</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-800 md:ml-[10rem] lg:ml-80">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex justify-center md:justify-start">
            <button className="px-8 py-3 border-t border-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z"/>
              </svg>
              <span className="text-xs font-semibold hidden md:inline">POSTS</span>
            </button>
            <button className="px-8 py-3 text-gray-500 flex items-center gap-2 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
              </svg>
              <span className="text-xs font-semibold hidden md:inline">REELS</span>
            </button>
            <button className="px-8 py-3 text-gray-500 flex items-center gap-2 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 5l7 7-7 7M12 5l7 7-7 7" strokeWidth="2"/>
              </svg>
              <span className="text-xs font-semibold hidden md:inline">SAVED</span>
            </button>
            <button className="px-8 py-3 text-gray-500 flex items-center gap-2 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" strokeWidth="2"/>
              </svg>
              <span className="text-xs font-semibold hidden md:inline">TAGGED</span>
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-1">
        <div className="grid grid-cols-3 gap-1">
          {/* Post 1 */}
          <div className="aspect-square bg-gray-900 relative overflow-hidden cursor-pointer group">
            <img 
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600" 
              className="w-full h-full object-cover transition"
              alt="Post"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm  bg-opacity-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="font-bold text-white">234</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <span className="font-bold text-white">45</span>
              </div>
            </div>
          </div>
          
          {/* Post 2 - Carousel */}
          <div className="aspect-square bg-gray-900 relative overflow-hidden cursor-pointer group">
            <img 
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600" 
              className="w-full h-full object-cover transition"
              alt="Post"
            />
            <div className="absolute top-2 right-2 z-10">
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M3 5h4v14H3V5zm7 0h4v14h-4V5zm7 0h4v14h-4V5z"/>
              </svg>
            </div>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm  bg-opacity-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="font-bold text-white text-lg">567</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <span className="font-bold text-white text-lg">89</span>
              </div>
            </div>
          </div>

          {/* Post 3 */}
          <div className="aspect-square  relative overflow-hidden cursor-pointer group">
            <img 
              src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600" 
              className="w-full h-full object-cover transition"
              alt="Post"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm bg-opacity-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {/*Post commenmts count*/}
                <span className="font-bold text-white text-lg">123</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                  {/*Post like count*/}
                <span className="font-bold text-white text-lg">32</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Settings Modal */}
<SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

export default Hero