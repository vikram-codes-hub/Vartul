import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

export const Usercontext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

const UserContextProvider = ({ children }) => {
  const [token, settoken] = useState(localStorage.getItem("token"));
  const [authMode, setAuthMode] = useState(null);

  const [authuser, setauthuser] = useState(null);
  const [user, setuser] = useState(null);

  const [socket, setsocket] = useState(null);
  const [onlineuser, setonlineuser] = useState([]);

  const [stats, setStats] = useState({ posts: 0,followers: 0, following: 0});

  const [loading, setLoading] = useState(true);

  /* ================= CHECK AUTH ================= */
  const checkauth = async () => {
    try {
      const { data } = await axios.get("/api/auth/checkauth");

      if (data.success) {
        setauthuser(data.user);
        setuser(data.user);
        connectsocket(data.user);
      }
    } catch (error) {
      localStorage.removeItem("token");
      settoken(null);
      setauthuser(null);
      setuser(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGIN / SIGNUP ================= */
  const Login = async ({ state, credentials }) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        setauthuser(data.UserData);
        setuser(data.UserData);
        connectsocket(data.UserData);

        axios.defaults.headers.common["token"] = data.token;
        localStorage.setItem("token", data.token);
        settoken(data.token);
        setAuthMode(state);

        toast.success(data.mssg);
      } else {
        toast.error(data.mssg);
      }
      return data;
    } catch (error) {
      toast.error("Login failed");
    }
  };

  /* ================= COMPLETE PROFILE ================= */
  const completeprofile = async (basicinfo) => {
    try {
      const { data } = await axios.post(
        "/api/auth/profile-setup",
        basicinfo,
        { headers: { token } }
      );

      if (data.success) {
        setauthuser(data.user);
        setuser(data.user);
          return { success: true };
      }
    } catch {
      toast.error("Profile setup failed");
       return { success: false };
    }
  };

  /* ================= UPDATE INTERESTS ================= */
  const updateUserInterests = async ({ interests, contentCategories }) => {
    try {
      const { data } = await axios.post(
        "/api/auth/interests",
        { interests, contentCategories },
        { headers: { token } }
      );

      if (data.success) {
        setauthuser(data.user);
        setuser(data.user);
           return { success: true };
      }

      return data;
    } catch {
      return { success: false };
    }
  };

  /* ================= upload profile pic ================= */
  const uploadProfilePicture = async (profilePicBase64) => {
  try {
    const { data } = await axios.put(
      "/api/auth/update-profile",
      { profilePic: profilePicBase64 },
      { headers: { token } }
    );
    console.log("In the profile pic ",data)
    if (data.success) {
      setuser(data.updateuser);
      return { success: true };
    }
  } catch (error) {
    return { success: false };
  }
};


  /* ================= FETCH CURRENT USER ================= */
  const fetchuser = async () => {
    try {
      const { data } = await axios.get("/api/auth/getcurrentuser");
      if (data.success) {
        setuser(data.user);
        setauthuser(data.user);
      }
    } catch {}
  };
  //fetch stats
  const fetchStats = async (userId) => {
  try {
    const { data } = await axios.get(`/api/auth/get-stats/${userId}`);
    if (data.success) {
      setStats({
        posts: data.postsCount,
        followers: data.followersCount,
        following: data.followingCount
      });
      console.log("from user context",data)
    }
  } catch (error) {
    console.log("Error fetching stats", error);
  }
};



  /* ================= SOCKET ================= */
  const connectsocket = (UserData) => {
    if (!UserData || socket?.connected) return;

    const newsocket = io(backendUrl, {
      query: { userId: UserData._id }
    });

    newsocket.on("connect", () => {
      console.log("✅ Socket connected:", newsocket.id);
    });

    newsocket.on("getOnlineUsers", (ids) => {
      setonlineuser(ids);
    });

    setsocket(newsocket);
  };

  /* ================= LOGOUT ================= */
  const Logout = () => {
    socket?.disconnect();
    setsocket(null);
    setauthuser(null);
    setuser(null);
    setonlineuser([]);
    localStorage.removeItem("token");
    axios.defaults.headers.common["token"] = null;
    settoken(null);
    toast.success("Logout successfully");
  };

  /* ================= INIT ================= */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkauth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const values = {
    token,
    authuser,
    user,
    onlineuser,
    socket,
    loading,
    stats,
     setuser,
    setStats,
    Login,
    Logout,
    checkauth,
    fetchuser,
    updateUserInterests,
    completeprofile,
     fetchStats,
     uploadProfilePicture
  };

  return (
    <Usercontext.Provider value={values}>
      {children}
    </Usercontext.Provider>
  );
};

export default UserContextProvider;
