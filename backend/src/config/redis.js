const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis max retries reached");
      return retries * 500;
    },
  },
});

redisClient.on("connect",      () => console.log("✅ Redis connected"));
redisClient.on("error",   (err) => console.error(`❌ Redis error: ${err.message}`));
redisClient.on("reconnecting", () => console.warn("⚠️  Redis reconnecting..."));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error(`❌ Redis failed: ${error.message} — running without cache`);
  }
};

// Store value with auto-expiry
// setEx("otp:9876543210", "482910", 600)  ← expires in 600 seconds
const setEx = async (key, value, ttlSeconds) => {
  try {
    await redisClient.setEx(key, ttlSeconds, String(value));
  } catch (e) {
    console.error(`Redis setEx [${key}]:`, e.message);
  }
};

// Get value — returns null if key does not exist or is expired
const get = async (key) => {
  try {
    return await redisClient.get(key);
  } catch (e) {
    console.error(`Redis get [${key}]:`, e.message);
    return null;
  }
};

// Delete a key
const del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (e) {
    console.error(`Redis del [${key}]:`, e.message);
  }
};

module.exports = { redisClient, connectRedis, setEx, get, del };
