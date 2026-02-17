import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: { type: String, required: true },

    // ✅ user selected schedule
    // Example: "2026-02-12"
    scheduleDate: { type: String, default: "" },
    // Example: "14:30"
    scheduleTime: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"], // ✅ added cancelled
      default: "pending",
    },

    rejectReason: { type: String, default: "" },

    // ✅ cancellation details
    cancelReason: { type: String, default: "" },
    cancelledBy: {
      type: String,
      enum: ["", "user", "provider"],
      default: "",
    },
    cancelledAt: { type: Date, default: null },

    distanceKm: { type: Number, default: 0 },
    etaHours: { type: Number, default: 0 },

    rating: { type: Number, default: 0 },
    review: { type: String, default: "" },

    userSnapshot: {
      name: { type: String, default: "" },
      mobile: { type: String, default: "" },
      locationLabel: { type: String, default: "" },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    providerSnapshot: {
      name: { type: String, default: "" },
      mobile: { type: String, default: "" },
      businessLabel: { type: String, default: "" },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", BookingSchema);
