import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, X, Grid, User, MoreHorizontal } from "lucide-react";
import { checkFollowStatusApi, followUserApi, unfollowUserApi } from "../api/followApi";
import { Usercontext } from "../context/Usercontext";
import { usePost } from "../context/PostContext";
import TipModal from "../Components/TipModal";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token } = useContext(Usercontext);
  const { toggleLike, commentOnPost } = usePost();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [followStatus, setFollowStatus] = useState({
    isFollowing: false,
    followsBack: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [showFollowMenu, setShowFollowMenu] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await axios.get(`/api/auth/getuser/${id}`);
        const statsRes = await axios.get(`/api/auth/get-stats/${id}`, {
          headers: { token }
        });
        const postsRes = await axios.get(`/api/post/user/${id}`, {
          headers: { token }
        });
        const followRes = await checkFollowStatusApi(id);

        setUser(userRes.data.user);
        setStats({
          posts: statsRes.data.postsCount,
          followers: statsRes.data.followersCount,
          following: statsRes.data.followingCount,
        });
        setPosts(postsRes.data.posts);
        setFollowStatus(followRes.data.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, token]);

  const handleFollowToggle = async () => {
    try {
      if (followStatus.isFollowing) {
        await unfollowUserApi(id);
        setFollowStatus({ ...followStatus, isFollowing: false });
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await followUserApi(id);
        setFollowStatus({ ...followStatus, isFollowing: true });
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
      setShowFollowMenu(false);
    } catch (err) {
      console.error("Follow action failed", err);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    await toggleLike(postId);

    // Update local post state
    setPosts(prev => prev.map(post =>
      post._id === postId
        ? {
          ...post,
          likes: post.likes.includes(currentUser._id)
            ? post.likes.filter(id => id !== currentUser._id)
            : [...post.likes, currentUser._id]
        }
        : post
    ));

    if (selectedPost?._id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        likes: prev.likes.includes(currentUser._id)
          ? prev.likes.filter(id => id !== currentUser._id)
          : [...prev.likes, currentUser._id]
      }));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPost) return;

    await commentOnPost(selectedPost._id, commentText);

    // Fetch updated post
    const res = await axios.get(`/api/post/${selectedPost._id}`, {
      headers: { token }
    });

    setSelectedPost(res.data.post);
    setPosts(prev => prev.map(p =>
      p._id === selectedPost._id ? res.data.post : p
    ));
    setCommentText("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">User not found</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === id;

  return (
    <div className="w-full bg-black min-h-screen text-white">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-12">
        <div className="flex items-start gap-8 md:gap-24">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 md:p-1">
              <img
                src={user.profilePic || "https://via.placeholder.com/150"}
                alt={user.username}
                className="w-full h-full rounded-full object-cover border-2 md:border-4 border-black"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            {/* Username + Buttons */}
            <div className="flex items-center gap-3 md:gap-5 mb-5">
              <h1 className="text-lg md:text-xl font-light">{user.username}</h1>

              {isOwnProfile ? (
                <div className="flex gap-2">
                  <button className="bg-gray-700 hover:bg-gray-600 px-3 md:px-6 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition">
                    Edit profile
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 px-3 md:px-6 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition">
                    View archive
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 relative">
                  {followStatus.isFollowing ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowFollowMenu(!showFollowMenu)}
                        className="px-6 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
                      >
                        Following
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </button>

                      {showFollowMenu && (
                        <div className="absolute top-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 w-48">
                          <button
                            onClick={handleFollowToggle}
                            className="w-full px-4 py-3 text-left text-red-500 hover:bg-gray-700 text-sm font-semibold"
                          >
                            Unfollow
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      className="px-6 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg"
                    >
                      Follow
                    </button>
                  )}

                  <button 
                    onClick={() => navigate('/chat', { state: { targetUser: user } })}
                    className="px-6 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg"
                  >
                    Message
                  </button>
                  <button 
                    onClick={() => setShowTipModal(true)}
                    className="px-6 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg"
                  >
                    Tip
                  </button>
                </div>
              )}

              <button className="text-white hover:text-gray-300">
                <MoreHorizontal size={24} />
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-5">
              <div>
                <span className="font-semibold">{stats.posts}</span>
                <span className="text-gray-400 ml-1">posts</span>
              </div>
              <button className="hover:text-gray-300">
                <span className="font-semibold">{stats.followers}</span>
                <span className="text-gray-400 ml-1">followers</span>
              </button>
              <button className="hover:text-gray-300">
                <span className="font-semibold">{stats.following}</span>
                <span className="text-gray-400 ml-1">following</span>
              </button>
            </div>

            {/* Bio */}
            <div>
              <p className="font-semibold text-sm">
                {user.firstName} {user.lastName}
              </p>
              {user.bio && (
                <p className="text-sm mt-1 whitespace-pre-wrap">{user.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex justify-center gap-16">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-1.5 py-3 text-xs font-semibold tracking-widest ${activeTab === "posts"
                  ? "text-white border-t border-white -mt-px"
                  : "text-gray-500"
                }`}
            >
              <Grid size={12} />
              POSTS
            </button>
            <button
              onClick={() => setActiveTab("tagged")}
              className={`flex items-center gap-1.5 py-3 text-xs font-semibold tracking-widest ${activeTab === "tagged"
                  ? "text-white border-t border-white -mt-px"
                  : "text-gray-500"
                }`}
            >
              <User size={12} />
              TAGGED
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Posts Grid */}
        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-1 mt-1">
            {posts.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <div className="inline-flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mb-4">
                    <Grid size={32} strokeWidth={1} className="text-white" />
                  </div>
                  <p className="text-white text-3xl font-light mb-2">No Posts Yet</p>
                </div>
              </div>
            ) : (
              posts.map((post) => (
                <button
                  key={post._id}
                  onClick={() => handlePostClick(post)}
                  className="aspect-square bg-gray-900 overflow-hidden relative group cursor-pointer"
                >
                  {post.mediaType === "image" ? (
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={post.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Heart size={20} fill="white" />
                      <span>{post.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <MessageCircle size={20} fill="white" />
                      <span>{post.comments?.length || 0}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Tagged - Empty State */}
        {activeTab === "tagged" && (
          <div className="col-span-3 text-center py-16">
            <div className="inline-flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mb-4">
                <User size={32} strokeWidth={1} className="text-white" />
              </div>
              <p className="text-white text-3xl font-light mb-2">No Photos</p>
            </div>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-black max-w-6xl w-full max-h-[90vh] flex rounded-lg overflow-hidden">
            {/* Media Side */}
            <div className="flex-1 bg-black flex items-center justify-center">
              {selectedPost.mediaType === "image" ? (
                <img
                  src={selectedPost.mediaUrl}
                  alt=""
                  className="max-w-full max-h-[90vh] object-contain"
                />
              ) : (
                <video
                  src={selectedPost.mediaUrl}
                  controls
                  className="max-w-full max-h-[90vh] object-contain"
                />
              )}
            </div>

            {/* Details Side */}
            <div className="w-[400px] bg-black border-l border-gray-800 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPost.userId?.profilePic || "https://via.placeholder.com/40"}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white font-semibold text-sm">
                    {selectedPost.userId?.username}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-white hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Caption & Comments */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Caption */}
                {selectedPost.caption && (
                  <div className="flex gap-3 mb-4">
                    <img
                      src={selectedPost.userId?.profilePic || "https://via.placeholder.com/40"}
                      alt=""
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div>
                      <span className="text-white font-semibold text-sm mr-2">
                        {selectedPost.userId?.username}
                      </span>
                      <span className="text-white text-sm">{selectedPost.caption}</span>
                    </div>
                  </div>
                )}

                {/* Comments */}
                {selectedPost.comments?.map((comment) => (
                  <div key={comment._id} className="flex gap-3 mb-4">
                    <img
                      src={comment.userId?.profilePic || "https://via.placeholder.com/40"}
                      alt=""
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div>
                      <span className="text-white font-semibold text-sm mr-2">
                        {comment.userId?.username}
                      </span>
                      <span className="text-white text-sm">{comment.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-800 p-4">
                <div className="flex gap-4 mb-3">
                  <button
                    onClick={(e) => handleLike(e, selectedPost._id)}
                    className="text-white hover:text-gray-300"
                  >
                    <Heart
                      size={24}
                      fill={selectedPost.likes?.includes(currentUser?._id) ? "red" : "none"}
                      color={selectedPost.likes?.includes(currentUser?._id) ? "red" : "white"}
                    />
                  </button>
                  <button className="text-white hover:text-gray-300">
                    <MessageCircle size={24} />
                  </button>
                </div>

                <div className="text-white font-semibold text-sm mb-2">
                  {selectedPost.likes?.length || 0} likes
                </div>

                {/* Comment Input - Using div instead of form */}
                <div className="flex items-center gap-2 border-t border-gray-800 pt-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleComment(e);
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className={`text-sm font-semibold ${commentText.trim()
                        ? "text-blue-500 hover:text-blue-400"
                        : "text-blue-300 cursor-not-allowed"
                      }`}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <TipModal creator={user} onClose={() => setShowTipModal(false)} />
      )}
    </div>
  );
};

export default UserProfile;