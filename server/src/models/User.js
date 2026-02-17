import mongoose from "mongoose";

const ProviderLocationSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    label: { type: String, default: "" },
  },
  { _id: false }
);

const ProviderSchema = new mongoose.Schema(
  {
    businessType: {
      type: String,
      enum: ["freelancer", "shop"],
      default: "freelancer",
    },
    shopName: { type: String, default: "" },

    // ✅ show in dashboard
    category: { type: String, default: "" },

    // ✅ list in dashboard + update
    serviceAreas: { type: [String], default: [] },

    // ✅ map selected business location
    businessLocation: { type: ProviderLocationSchema, default: null },

    address: { type: String, default: "" },

    // ✅ Availability
    availability: {
      workingDays: { type: [String], default: [] },
      fromTime: { type: String, default: "" },
      toTime: { type: String, default: "" },
    },

    experience: { type: String, default: "" },
    description: { type: String, default: "" },

    // ✅ Ratings (avg + count)
    ratingAvg: { type: Number, default: 0 }, // ex: 4.3
    ratingCount: { type: Number, default: 0 }, // ex: 12
  },
  { _id: false }
);

const CurrentLocationSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    label: { type: String, default: "" },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "provider", "admin"], required: true },

    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    address: { type: String, default: "" },

    // ✅ User profile fields
    photo: { type: String, default: "" }, // base64 for now
    currentLocation: { type: CurrentLocationSchema, default: null },

    // ✅ provider profile
    provider: { type: ProviderSchema, default: null },
    lastLoginAt: { type: Date, default: null },

  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
