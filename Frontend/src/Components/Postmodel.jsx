import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import PostViewModal from "../Models/PostViewModal";


const PostModal = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/post/${postId}`, {
          headers: { token }
        });
        setPost(res.data.post);
      } catch (error) {
        console.error("Error fetching post:", error);
        setError(true);
        // Redirect to home after 2 seconds if post not found
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white text-sm">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-white text-lg">Post not found</p>
          <p className="text-gray-400 text-sm">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return <PostViewModal post={post} onClose={() => navigate(-1)} />;
};

export default PostModal;