import express from "express";
import PDFDocument from "pdfkit";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Feedback from "../models/Feedback.js"; // if feedback model name different, change here

const router = express.Router();

/* ---------------------------
   ADMIN AUTH MIDDLEWARE
---------------------------- */
function requireAdminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "No token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    req.adminId = decoded.id;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/* ---------------------------
   PDF HELPERS
---------------------------- */
function setupPDF(res, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

function addTitle(doc, text) {
  doc.fontSize(18).text(text, { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor("gray")
    .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
  doc.fillColor("black");
  doc.moveDown(1);
}

/* ---------------------------
   MAIN REPORT ROUTE
---------------------------- */
router.get("/:type/pdf", requireAdminAuth, async (req, res) => {
  try {
    const type = String(req.params.type || "").toLowerCase();

    const doc = new PDFDocument({ margin: 50 });
    setupPDF(res, `servespot-${type}-report.pdf`);
    doc.pipe(res);

    addTitle(doc, `ServeSpot - ${type.toUpperCase()} REPORT`);

    /* ================= USERS ================= */
    if (type === "users") {
      const users = await User.find({ role: "user" })
        .select("name email mobile createdAt")
        .sort({ createdAt: -1 })
        .limit(300);

      doc.fontSize(12).text(`Total Users: ${users.length}`);
      doc.moveDown();

      users.forEach((u, i) => {
        doc
          .fontSize(10)
          .text(
            `${i + 1}. ${u.name} | ${u.email} | ${u.mobile || "-"} | ${String(
              u.createdAt
            ).slice(0, 10)}`
          );
      });
    }

    /* ================= PROVIDERS ================= */
    else if (type === "providers") {
      const providers = await User.find({ role: "provider" })
        .select("name email mobile provider.category createdAt")
        .sort({ createdAt: -1 })
        .limit(300);

      doc.fontSize(12).text(`Total Providers: ${providers.length}`);
      doc.moveDown();

      providers.forEach((p, i) => {
        doc
          .fontSize(10)
          .text(
            `${i + 1}. ${p.name} | ${p.email} | ${
              p.mobile || "-"
            } | ${p?.provider?.category || "-"}`
          );
      });
    }

    /* ================= BOOKINGS ================= */
    else if (type === "bookings") {
      const bookings = await Booking.find({})
        .select("category status scheduleDate scheduleTime createdAt")
        .sort({ createdAt: -1 })
        .limit(400);

      const total = bookings.length;
      const completed = bookings.filter((b) => b.status === "completed").length;

      doc.fontSize(12).text(`Total Bookings: ${total}`);
      doc.fontSize(12).text(`Completed Bookings: ${completed}`);
      doc.moveDown();

      bookings.forEach((b, i) => {
        doc
          .fontSize(10)
          .text(
            `${i + 1}. ${b.category} | ${b.status} | ${b.scheduleDate} ${b.scheduleTime}`
          );
      });
    }

    /* ================= FEEDBACK ================= */
    else if (type === "feedback") {
      const feedbacks = await Feedback.find({})
        .select("userName role message createdAt")
        .sort({ createdAt: -1 })
        .limit(300);

      doc.fontSize(12).text(`Total Feedback Entries: ${feedbacks.length}`);
      doc.moveDown();

      feedbacks.forEach((f, i) => {
        doc
          .fontSize(10)
          .text(
            `${i + 1}. ${f.userName} (${f.role}) - ${f.message}`
          );
        doc.moveDown(0.5);
      });
    }

    /* ================= SUMMARY ================= */
    else if (type === "summary") {
      const totalUsers = await User.countDocuments({ role: "user" });
      const totalProviders = await User.countDocuments({ role: "provider" });
      const totalBookings = await Booking.countDocuments({});
      const completedBookings = await Booking.countDocuments({
        status: "completed",
      });

      doc.fontSize(12).text(`Total Users: ${totalUsers}`);
      doc.fontSize(12).text(`Total Providers: ${totalProviders}`);
      doc.fontSize(12).text(`Total Bookings: ${totalBookings}`);
      doc.fontSize(12).text(`Completed Bookings: ${completedBookings}`);
    }

    else {
      doc.fontSize(14).fillColor("red").text("Invalid Report Type ❌");
    }

    doc.end();
  } catch (err) {
    console.error("REPORT ERROR:", err);
    return res.status(500).json({ message: "Server error generating report" });
  }
});

export default router;