import express from 'express';
import "dotenv/config";
import http from 'http';
import cors from "cors";
import { connectDb } from './Config/db.js'
import userRouter from './Routes/UserRoute.js';
import { Server } from 'socket.io';
import User from './Models/User.js'
import chatRouter from "./Routes/Chatroute.js";

import redisClient from './Config/redis.js';
import postRouter from './Routes/PostRoute.js';
import storyrouter from './Routes/Stroyrouter.js';
import notificationrouter from './Routes/Notificatinrouter.js';
import savedpostrouter from './Routes/Savedpostrouter.js';
import Reelrouter from './Routes/Reelrouter.js';
import engagementRouter from './routes/EngagementRoute.js';
import governanceRouter from './routes/GovernanceRoute.js';
import mlRouter from './routes/MlRoute.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "token", 
    ],
  })
);


import { setIO, UserSocketMap } from './Utils/socket.js';

// Socket.io setup
const io = new Server(server, {
  cors: { origin: "*" }
});
setIO(io);


// Connect to DB
await connectDb();
// Connect to Redis Cloud
try {
  await redisClient.connect();
  console.log("🔗 Redis connection established!");
} catch (err) {
  console.error("❌ Redis connection failed:", err.message);
}



// Socket.io connection handler
io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    console.log("❌ No userId provided in handshake");
    return;
  }

  console.log("🟢 User connected:", userId);

  //  Add user to socket map
  UserSocketMap[userId] = socket.id;

  //  Update user's lastSeen to "now" (connected)
  try {
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
  } catch (err) {
    console.error("⚠️ Error updating lastSeen on connect:", err.message);
  }

  // 3 Emit all online user IDs
  io.emit("getOnlineUsers", Object.keys(UserSocketMap));

  // --- Real-time Events (Phase 2 Polishing) ---

  // 1. Typing indicators
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = UserSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = UserSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { userId });
    }
  });

  // 2. Read receipts
  socket.on("markAsRead", ({ conversationId, senderId }) => {
    // senderId is the person who sent the messages that are now read by current userId
    const senderSocketId = UserSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { conversationId, readerId: userId });
    }
  });

  //  Handle disconnection
  socket.on("disconnect", async () => {
    console.log("🔴 User disconnected:", userId);

    delete UserSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(UserSocketMap));

    //  Update lastSeen when user goes offline
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      console.log(`🕓 Updated lastSeen for ${userId}`);
    } catch (err) {
      console.error("⚠️ Error updating lastSeen on disconnect:", err.message);
    }
  });

  //  Message relay (kept for backward compatibility or direct socket sends)
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    const receiverSocketId = UserSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        senderId,
        message,
      });
    }
  });
});

// Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
// User routes
app.use("/api/auth", userRouter);
// Chat routes
app.use("/api/messages",chatRouter);
// Post routes
app.use('/api/post',postRouter)
//story route
app.use('/api/story',storyrouter)
//notification route
app.use('/api/notification',notificationrouter)
//saved post
app.use('/api/saved-post',savedpostrouter)
//reel router
app.use('/api/reels',Reelrouter)
//engagement router
app.use('/api/engagement', engagementRouter);
//governance router
app.use('/api/governance', governanceRouter);
// ML router
app.use('/api/ml', mlRouter);


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default server;
