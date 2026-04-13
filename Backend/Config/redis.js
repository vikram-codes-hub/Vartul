import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    tls: process.env.REDIS_TLS === "true" ? {} : false,
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries >= 2) {
        console.warn("⚠️  Redis: giving up after 2 retries. Running without cache.");
        return false; // stop retrying
      }
      return Math.min(retries * 500, 2000);
    },
  },
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis Cloud successfully!");
});

redisClient.on("error", (err) => {
  // Only log, never crash
  console.error("❌ Redis Client Error:", err.message);
});

// Track whether Redis is actually usable
let redisReady = false;

redisClient.on("ready", () => {
  redisReady = true;
  console.log("🔗 Redis is ready!");
});

redisClient.on("end", () => {
  redisReady = false;
});

// A safe proxy that silently no-ops when Redis is unavailable
const safeRedis = new Proxy(redisClient, {
  get(target, prop) {
    const original = target[prop];
    if (typeof original === "function") {
      return async (...args) => {
        if (!redisReady && prop !== "connect" && prop !== "on") {
          return null; // silently skip
        }
        try {
          return await original.apply(target, args);
        } catch (err) {
          console.warn(`⚠️  Redis op "${String(prop)}" failed silently:`, err.message);
          return null;
        }
      };
    }
    return typeof original === "function" ? original.bind(target) : original;
  },
});

export { redisReady };
export default safeRedis;
