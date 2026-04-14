import React, { useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Usercontext } from "./Context/Usercontext";

/* Layout */
import Layout from "./Utils/Layout";

/* Pages */
import Home from "./Pages/Home";
import Reels from "./Pages/Reels";
import Settings from "./Pages/Settings";
import Chat from "./Pages/Chat";
import Twt_Token from "./Pages/Twt_Token";
import Dashboard from "./Pages/Dashboard";
import DashboardLayout from "./Pages/DashboardLayout";
import Overview from "./Pages/dashboard/Overview";
import WalletPage from "./Pages/dashboard/WalletPage";
import StakingPage from "./Pages/dashboard/StakingPage";
import RewardsPage from "./Pages/dashboard/RewardsPage";
import TransactionsPage from "./Pages/dashboard/TransactionsPage";
import CreatorEarnings from "./Pages/dashboard/CreatorEarnings";
import Myprofile from "./Pages/Myprofile";
import UserProfile from "./Pages/UserProfile";
import EditProfile from "./Pages/Editporifle";
import AuthPage from "./Pages/Authpage";
import About from "./Pages/About";

/* Profile setup */
import BasicInfo from "./Pages/Basicinfo";
import InterestsSetup from "./Pages/InterestsSetup";
import ProfilePicture from "./Pages/ProfilePicture";

/* Modals / Other */
import PostModal from "./Components/Postmodel";
import Footer from "./Pages/Footer";

/* 🔥 STORY VIEWER */
import StoryViewer from "./Models/StoryViewer";

/* 💬 FLOATING CHAT BAR */
import FloatingChatBar from "./Components/Chat/FloatingChatBar";

const App = () => {
  const location = useLocation();
  const { authuser } = useContext(Usercontext);

  /* Hide sidebar on auth & profile-setup pages */
  const hideSidebar =
    location.pathname === "/auth" ||
    location.pathname.startsWith("/profile-setup");

  /* Hide footer on some pages */
  const hideFooter =
    location.pathname === "/auth" ||
    location.pathname.startsWith("/profile-setup") ||
    location.pathname.startsWith("/chat");

  return (
    <>
      <ToastContainer />

      <Routes>
        {/* ================= AUTH ================= */}
        <Route
          path="/auth"
          element={
            authuser
              ? authuser.profileCompleted
                ? <Navigate to="/" />
                : <Navigate to="/profile-setup/basic-info" />
              : <AuthPage />
          }
        />

        {/* ================= PROFILE SETUP ================= */}
        <Route
          path="/profile-setup/basic-info"
          element={authuser ? <BasicInfo /> : <Navigate to="/auth" />}
        />
        <Route
          path="/profile-setup/interests"
          element={authuser ? <InterestsSetup /> : <Navigate to="/auth" />}
        />
        <Route
          path="/profile-setup/profile-picture"
          element={authuser ? <ProfilePicture /> : <Navigate to="/auth" />}
        />

        {/* ================= MAIN APP (WITH SIDEBAR) ================= */}
        <Route element={<Layout hideSidebar={hideSidebar} />}>
          <Route
            path="/"
            element={authuser ? <Home /> : <Navigate to="/auth" />}
          />
          <Route
            path="/reels"
            element={authuser ? <Reels /> : <Navigate to="/auth" />}
          />
          <Route
            path="/settings"
            element={authuser ? <Settings /> : <Navigate to="/auth" />}
          />
          <Route
            path="/about"
            element={authuser ? <About /> : <Navigate to="/auth" />}
          />
          <Route
            path="/chat"
            element={authuser ? <Chat /> : <Navigate to="/auth" />}
          />
          <Route
            path="/twt-token"
            element={authuser ? <Twt_Token /> : <Navigate to="/auth" />}
          />
          <Route
            path="/dashboard"
            element={authuser ? <DashboardLayout /> : <Navigate to="/auth" />}
          >
            <Route index element={<Overview />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="staking" element={<StakingPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="creator-earnings" element={<CreatorEarnings />} />
          </Route>

          {/* 🔥 PROFILES */}
          <Route
            path="/profile"
            element={authuser ? <Myprofile /> : <Navigate to="/auth" />}
          />
          <Route
            path="/profile/:id"
            element={authuser ? <UserProfile /> : <Navigate to="/auth" />}
          />
          <Route
            path="/edit-profile"
            element={authuser ? <EditProfile /> : <Navigate to="/auth" />}
          />
        </Route>

        {/* ================= POST MODAL ================= */}
        <Route
          path="/p/:postId"
          element={authuser ? <PostModal /> : <Navigate to="/auth" />}
        />
      </Routes>

      {/* ================= FOOTER ================= */}
      {!hideFooter && <Footer />}

      {/* 🔥 STORY VIEWER MODAL (Global - renders when activeUserStories exists) */}
      {authuser && <StoryViewer />}

      {/* 💬 FLOATING CHAT BAR (shown on all pages except chat/auth/setup) */}
      {authuser && !hideSidebar && !location.pathname.startsWith('/chat') && (
        <FloatingChatBar />
      )}
    </>
  );
};

export default App;