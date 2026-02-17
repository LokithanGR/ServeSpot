import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Feedback from "../models/Feedback.js";
const router = Router();


// ===============================
// ✅ ADMIN AUTH MIDDLEWARE
// ===============================
function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token)
      return res.status(401).json({ ok: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded?.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Admin only" });
    }

    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}


// ===============================
// ✅ HELPER — SHORT LOCATION FORMAT
// Example:
// "Tharamani, Chennai, Tamil Nadu"
// -> "Chennai (Tharamani)"
// ===============================
function shortLocation(label = "") {

  const parts = String(label || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!parts.length) return "—";

  const area = parts[0]; // Tharamani
  const city =
    parts.find((p) => /chennai/i.test(p)) ||
    parts[1] ||
    "";

  if (city) return `${city} (${area})`;

  return area;
}



// ===============================
// ✅ TODAY REPORT
// ===============================
router.get("/today-report", requireAdmin, async (req, res) => {
  try {

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const loggedInToday = await User.find({
      lastLoginAt: { $gte: start, $lte: end },
      role: { $in: ["user", "provider"] },
    }).select("name role email mobile lastLoginAt");

    const registeredToday = await User.find({
      createdAt: { $gte: start, $lte: end },
      role: { $in: ["user", "provider"] },
    }).select("name role email mobile createdAt");

    return res.json({
      ok: true,
      loggedInToday,
      registeredToday,
    });

  } catch (e) {
    console.log(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});



// ===============================
// ✅ ALL USERS LIST
// ===============================
router.get("/users", requireAdmin, async (req, res) => {
  try {

    const users = await User.find({
      role: { $in: ["user", "provider"] },
    })
      .sort({ createdAt: -1 })
      .select(
        "name role email mobile createdAt lastLoginAt provider.category"
      );

    return res.json({ ok: true, users });

  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});



// ===============================
// ✅ SERVICE CATEGORIES
// ===============================
router.get("/categories", requireAdmin, (req, res) => {

  const categories = [
    "Women's spa / saloon",
    "Men's saloon",
    "Cleaning & Pest Control",
    "Electrician, Plumber & Carpenter",
    "AC & Appliance Repair",
    "Painting & Waterproofing",
  ];

  return res.json({ ok: true, categories });
});



// ===============================
// ✅ PROVIDERS BY CATEGORY
// ===============================
router.get("/providers", requireAdmin, async (req, res) => {
  try {

    const category = String(req.query.category || "").trim();

    if (!category)
      return res
        .status(400)
        .json({ ok: false, message: "category required" });

    const providers = await User.find({
      role: "provider",
      "provider.category": category,
    }).select(
      "name mobile email provider.category provider.availability provider.serviceAreas provider.businessLocation"
    );

    // 🔥 Format response (short location add pannom)
    const formatted = providers.map((p) => {

      const label = p?.provider?.businessLocation?.label || "";

      return {
        id: p._id,
        name: p.name || "",
        mobile: p.mobile || "",
        email: p.email || "",
        category: p?.provider?.category || "",
        serviceAreas: p?.provider?.serviceAreas || [],
        availability: p?.provider?.availability || null,
        locationShort: shortLocation(label),
      };
    });

    return res.json({ ok: true, providers: formatted });

  } catch (e) {
    console.log(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ✅ User Feedbacks
router.get("/feedback", requireAdmin, async (req, res) => {
  try {
    const list = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ ok: true, feedbacks: list });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
