import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // snapshot (so later name change aanaalum old feedback same)
    userName: { type: String, default: "" },
    role: { type: String, enum: ["user", "provider"], required: true },

    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", FeedbackSchema);
