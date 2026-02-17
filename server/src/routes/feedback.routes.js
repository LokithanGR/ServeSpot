import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Feedback from "../models/Feedback.js";

const router = Router();

function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

// ✅ Submit feedback (user/provider both allowed)
router.post("/", requireAuth, async (req, res) => {
  try {
    const role = String(req.user.role || "").toLowerCase();
    if (!["user", "provider"].includes(role)) {
      return res.status(403).json({ ok: false, message: "Only user/provider can send feedback" });
    }

    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ ok: false, message: "Feedback message required" });
    if (message.length > 500) return res.status(400).json({ ok: false, message: "Max 500 chars" });

    const me = await User.findById(req.user.id).select("name role");
    if (!me) return res.status(404).json({ ok: false, message: "User not found" });

    const fb = await Feedback.create({
      userId: me._id,
      userName: me.name,
      role: me.role,
      message,
    });

    return res.json({ ok: true, feedback: fb });
  } catch (e) {
    console.error("FEEDBACK SUBMIT ERROR:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
