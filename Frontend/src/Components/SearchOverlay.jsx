import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/auth/search/${query}`);
      if (data.success) {
        setResults(data.user);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    // Add to recent searches
    const updated = [
      user,
      ...recentSearches.filter((u) => u._id !== user._id),
    ].slice(0, 10); // Keep only last 10

    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    navigate(`/profile/${user._id}`);
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const removeRecentSearch = (userId, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter((u) => u._id !== userId);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showResults = query.trim() && results.length > 0;
  const showNoResults = query.trim() && !loading && results.length === 0;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="absolute left-0 top-0 h-full w-full md:w-[400px] bg-black border-r border-gray-800/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#262626] pl-10 pr-4 py-2.5 rounded-lg outline-none text-white text-sm placeholder-gray-500"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-65px)]">
          
          {/* Recent Searches */}
          {showRecent && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Recent</h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-blue-500 text-sm font-semibold hover:text-blue-400"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-1">
                {recentSearches.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center justify-between gap-3 cursor-pointer hover:bg-[#1a1a1a] p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={user.profilePic || "/default-avatar.png"}
                        alt={user.username}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => removeRecentSearch(user._id, e)}
                      className="text-gray-500 hover:text-gray-300 p-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
            </div>
          )}

          {showResults && !loading && (
            <div className="p-4 space-y-1">
              {results.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-[#1a1a1a] p-2 rounded-lg transition-colors"
                >
                  <img
                    src={user.profilePic || "/default-avatar.png"}
                    alt={user.username}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.firstName} {user.lastName}
                      {user.bio && ` · ${user.bio}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {showNoResults && (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-20 h-20 rounded-full border-4 border-gray-800 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-semibold mb-1">
                No results found
              </p>
              <p className="text-gray-500 text-xs text-center">
                Try searching for people, usernames, or names
              </p>
            </div>
          )}

          {/* Empty State */}
          {!query.trim() && recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-semibold mb-1">
                Search for people
              </p>
              <p className="text-gray-500 text-xs text-center">
                Find friends and creators on Vartul
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;