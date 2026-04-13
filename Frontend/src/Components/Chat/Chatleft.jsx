import React, { useContext, useState, useMemo, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ChatContext } from '../../Context/Chat';
import { Usercontext } from '../../context/Usercontext';

const Chatleft = () => {
  const { user } = useContext(Usercontext);
  const { chatUsers, unseenMap, selectedChat, setSelectedChat, loadingChats, removeConversation, typingUsers } = useContext(ChatContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'search'

  // Debounced global search
  useEffect(() => {
    if (activeTab !== 'search' || !searchTerm.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const { searchUsers } = await import('../../api/user.api.js');
        const results = await searchUsers(searchTerm);
        setGlobalSearchResults(results || []);
      } catch (error) {
        console.error("Global search failed", error);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab]);

  const filteredLocalUsers = useMemo(() => {
    if (!searchTerm) return chatUsers;
    return chatUsers.filter(u => 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatUsers, searchTerm]);

  return (
    <div className='p-4 sm:p-6 h-full w-full max-w-[350px] bg-black border-r border-gray-800 flex flex-col'>
      {/* Header Section */}
      <div className='flex items-center justify-between sm:justify-start sm:space-x-8 md:space-x-12 lg:space-x-16 shrink-0'>
        {/* User Profile */}
        <div className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200'>
          <p className='font-bold text-xl sm:text-2xl text-white truncate max-w-[150px] sm:max-w-none'>
            {user?.username || 'You'}
          </p>
          <ChevronDownIcon className='w-6 h-6 text-gray-400 hover:text-white transition-colors duration-200 flex-shrink-0'/>
        </div>
        
        {/* Edit Icon */}
        <div className='cursor-pointer p-2 rounded-lg transition-colors duration-200 flex-shrink-0'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-colors duration-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </div>
      </div>

      {/* Search Section */}
      <div className='mt-4 sm:mt-6 shrink-0'>
        <div className='relative w-full'>
          <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10'/>
          <input 
            type="text"
            placeholder='Search' 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full h-10 sm:h-11 bg-[#2a2a2a] border border-gray-600 rounded-lg pl-10 pr-4 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-all duration-200'
          />
        </div>
      </div>

      {/* Messages Header & Tabs */}
      <div className='flex justify-between items-center mt-6 mb-2 shrink-0 border-b border-gray-800 pb-2'>
        <div className='flex gap-4'>
           <p 
             onClick={() => { setActiveTab('messages'); setSearchTerm(''); }}
             className={`font-bold text-base cursor-pointer transition-colors duration-200 ${activeTab === 'messages' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Messages
           </p>
           <p 
             onClick={() => setActiveTab('search')}
             className={`font-bold text-base cursor-pointer transition-colors duration-200 ${activeTab === 'search' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
           >
             Find Users
           </p>
        </div>
        <p className='text-sm text-gray-400 cursor-pointer hover:text-white transition-colors duration-200'>Requests</p>
      </div>

      {/* Chat / Search List */}
      <div className='flex-1 overflow-y-auto scrollbar-hide'>
        {/* GLOBAL SEARCH VIEW */}
        {activeTab === 'search' ? (
          isSearchingGlobal ? (
            <div className="flex justify-center mt-10">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : searchTerm && globalSearchResults.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-10">
              No users found matching "{searchTerm}".
            </div>
          ) : !searchTerm ? (
             <div className="text-gray-500 text-sm text-center mt-10">
              Type to search for new people.
            </div>
          ) : (
            globalSearchResults.map((searchUser) => {
              const displayName = searchUser.username || searchUser.name || 'User';
              const avatar = searchUser.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

              return (
                <div 
                  key={searchUser._id} 
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors duration-200 mt-1 ${
                    selectedChat?._id === searchUser._id ? 'bg-gray-800' : ''
                  }`} 
                  onClick={() => {
                     setSelectedChat(searchUser);
                     setActiveTab('messages'); // Switch back after selecting
                     setSearchTerm(''); // Clear search
                  }}
                >
                  <img src={avatar} alt={displayName} className='w-12 h-12 rounded-full object-cover flex-shrink-0 border border-white/10' />
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-gray-200 text-sm sm:text-base truncate'>{displayName}</p>
                    <p className='text-xs sm:text-sm text-gray-500 truncate'>Start a conversation</p>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* LOCAL MESSAGES VIEW */
          loadingChats ? (
             <div className="flex justify-center mt-10">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
             </div>
          ) : filteredLocalUsers.length === 0 ? (
             <div className="flex flex-col items-center text-gray-500 text-sm text-center mt-10 p-4">
                {searchTerm ? (
                  "No chats found matching search."
                ) : (
                  <>
                     <p className="mb-2">No active chats yet.</p>
                     <button onClick={() => setActiveTab('search')} className="text-blue-500 font-semibold hover:underline">Find people to message</button>
                  </>
                )}
             </div>
          ) : (
            filteredLocalUsers.map((chatUser) => {
              const unreadCount = unseenMap[chatUser._id] || 0;
              const displayName = chatUser.username || chatUser.name || 'User';
              const avatar = chatUser.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;

              return (
                <div 
                  key={chatUser._id} 
                  className={`flex relative group items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors duration-200 mt-1 ${
                    selectedChat?._id === chatUser._id ? 'bg-gray-800' : ''
                  }`} 
                  onClick={() => setSelectedChat(chatUser)}
                >
                  <img src={avatar} alt={displayName} className='w-12 h-12 rounded-full object-cover flex-shrink-0 border border-white/10' />
                  <div className='flex-1 min-w-0 pr-6'>
                    <p className={`text-sm sm:text-base truncate ${unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-gray-200'}`}>
                      {displayName}
                    </p>
                    <p className={`text-xs sm:text-sm truncate ${typingUsers[chatUser._id] ? 'text-blue-400 font-medium animate-pulse' : (unreadCount > 0 ? 'font-semibold text-gray-200' : 'text-gray-500')}`}>
                      {typingUsers[chatUser._id] ? 'Typing...' : (chatUser.lastMessage || 'Say hi to start a conversation')}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <div className='bg-blue-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0'>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                  {/* Delete Conversation Button (Hover) */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm(`Delete conversation with ${displayName}?`)) {
                        removeConversation(chatUser._id);
                      }
                    }}
                    className="hidden group-hover:flex p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors absolute right-2"
                    title="Delete Conversation"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};

export default Chatleft;