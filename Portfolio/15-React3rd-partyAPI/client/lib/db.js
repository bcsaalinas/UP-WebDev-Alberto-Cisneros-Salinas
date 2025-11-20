import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sw-watchlist";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "sw-watchlist",
      })
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function safeConnect() {
  try {
    const conn = await connectDB();
    return conn;
  } catch (error) {
    console.error("Mongo connection failed:", error.message);
    return null;
  }
}
