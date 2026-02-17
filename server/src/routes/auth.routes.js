import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ✅ helper: auth middleware (simple)
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ ok: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

/* ---------------------------------------------------------
   ✅ availability workingDays normalize helper
   - Supports: mon, tue, wed... + monday, tuesday...
   - Always returns canonical: Monday, Tuesday...
---------------------------------------------------------- */
const DAY_ALIASES = {
  sun: "Sunday",
  sunday: "Sunday",

  mon: "Monday",
  monday: "Monday",

  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",

  wed: "Wednesday",
  wednesday: "Wednesday",

  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",

  fri: "Friday",
  friday: "Friday",

  sat: "Saturday",
  saturday: "Saturday",
};

function normalizeWorkingDays(input) {
  if (!Array.isArray(input)) return [];

  // trim + lowercase + alias map + unique
  return Array.from(
    new Set(
      input
        .map((d) => String(d || "").trim().toLowerCase())
        .filter(Boolean)
        .map((d) => DAY_ALIASES[d] || null)
        .filter(Boolean)
    )
  );
}

/* ---------------------------------------------
   ✅ ADMIN DEFAULT LOGIN (HARD CODED)
   POST /api/auth/admin/login
---------------------------------------------- */
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username !== "loki" || password !== "Loki@2004") {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { role: "admin", username: "loki", name: "Loki" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      admin: { username: "loki", name: "Loki" },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ✅ USER REGISTER
router.post("/register/user", async (req, res) => {
  try {
    const { name, mobile, email, password, address } = req.body;

    if (!name || !mobile || !email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ ok: false, message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      role: "user",
      name,
      mobile,
      email: email.toLowerCase(),
      passwordHash,
      address: address || "",
      photo: "",
      currentLocation: null,

      // ✅ track
      lastLoginAt: null,
    });

    return res.json({ ok: true, message: "User registered", id: user._id });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ✅ PROVIDER REGISTER
router.post("/register/provider", async (req, res) => {
  try {
    const {
      ownerName,
      mobile,
      email,
      password,
      businessType,
      shopName,
      category,
      address,
      workingDays,
      fromTime,
      toTime,
      experience,
      description,
    } = req.body;

    if (!ownerName || !mobile || !email || !password || !category) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ ok: false, message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      role: "provider",
      name: ownerName,
      mobile,
      email: email.toLowerCase(),
      passwordHash,
      address: address || "",
      photo: "",
      currentLocation: null,

      provider: {
        businessType: businessType || "freelancer",
        shopName: businessType === "shop" ? shopName || "" : "",
        category: category || "",
        address: address || "",

        serviceAreas: [],
        businessLocation: null,

        availability: {
          // ✅ FIX: always canonical (Monday, Tuesday...)
          workingDays: normalizeWorkingDays(workingDays),
          fromTime: fromTime || "",
          toTime: toTime || "",
        },
        experience: experience || "",
        description: description || "",
      },

      // ✅ track
      lastLoginAt: null,
    });

    return res.json({ ok: true, message: "Provider registered", id: user._id });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ✅ LOGIN (USER/PROVIDER) + lastLoginAt update
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ ok: false, message: "Missing fields" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return res.status(401).json({ ok: false, message: "Invalid credentials" });

    // ✅ update login time
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        mobile: user.mobile || "",
        photo: user.photo || "",
        currentLocation: user.currentLocation || null,
        provider: user.provider || null,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ✅ UPDATE USER PROFILE
router.put("/user/profile", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const { name, mobile, photo, currentLocation } = req.body;

    const update = {};
    if (typeof name === "string") update.name = name;
    if (typeof mobile === "string") update.mobile = mobile;
    if (typeof photo === "string") update.photo = photo;

    if (currentLocation === null) update.currentLocation = null;
    if (currentLocation && typeof currentLocation === "object") {
      update.currentLocation = {
        lat: Number(currentLocation.lat),
        lng: Number(currentLocation.lng),
        label: String(currentLocation.label || ""),
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
    });
    if (!updatedUser)
      return res.status(404).json({ ok: false, message: "User not found" });

    return res.json({
      ok: true,
      user: {
        id: updatedUser._id,
        role: updatedUser.role,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile || "",
        photo: updatedUser.photo || "",
        currentLocation: updatedUser.currentLocation || null,
        provider: updatedUser.provider || null,
      },
      message: "Profile updated",
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ✅ UPDATE PROVIDER PROFILE (DB update)
// Route: PUT /api/auth/provider/profile
router.put("/provider/profile", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const { mobile, photo, serviceAreas, businessLocation, availability } = req.body;

    const update = {};
    if (typeof mobile === "string") update.mobile = mobile;
    if (typeof photo === "string") update.photo = photo;

    // ✅ provider nested update
    if (Array.isArray(serviceAreas)) {
      update["provider.serviceAreas"] = serviceAreas
        .map((x) => String(x).trim())
        .filter(Boolean);
    }

    if (businessLocation === null) update["provider.businessLocation"] = null;
    if (businessLocation && typeof businessLocation === "object") {
      update["provider.businessLocation"] = {
        lat: Number(businessLocation.lat),
        lng: Number(businessLocation.lng),
        label: String(businessLocation.label || ""),
      };
    }

    // ✅ availability update (workingDays + fromTime + toTime)
    if (availability === null) {
      update["provider.availability"] = { workingDays: [], fromTime: "", toTime: "" };
    }

    if (availability && typeof availability === "object") {
      // ✅ FIX: normalize workingDays to canonical names
      const wd = normalizeWorkingDays(availability.workingDays);

      const ft = typeof availability.fromTime === "string" ? availability.fromTime.trim() : "";
      const tt = typeof availability.toTime === "string" ? availability.toTime.trim() : "";

      update["provider.availability.workingDays"] = wd;
      update["provider.availability.fromTime"] = ft;
      update["provider.availability.toTime"] = tt;
    }

    const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    if (!updated) return res.status(404).json({ ok: false, message: "User not found" });

    return res.json({
      ok: true,
      user: {
        id: updated._id,
        role: updated.role,
        name: updated.name,
        email: updated.email,
        mobile: updated.mobile || "",
        photo: updated.photo || "",
        provider: updated.provider || null,
      },
      message: "Provider profile updated",
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
