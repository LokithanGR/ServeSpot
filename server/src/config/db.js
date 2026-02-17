import mongoose from "mongoose";

export async function connectDB(mongoUri) {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}
