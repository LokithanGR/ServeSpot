import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

// ---------------- helpers ----------------
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function isValidDateStr(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function isValidTimeStr(s) {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.trim());
}

function timeToMinutes(t) {
  const [hh, mm] = String(t).split(":").map(Number);
  return hh * 60 + mm;
}

function dayNameFromDateStr(dateStr) {
  // avoid timezone edge: set noon
  const d = new Date(`${dateStr}T12:00:00`);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()];
}

// ✅ Day normalize (Mon/Monday both ok)
function normalizeDay(d) {
  return String(d || "").trim().toLowerCase();
}

function expandDayAliases(fullDay) {
  const map = {
    sunday: "sun",
    monday: "mon",
    tuesday: "tue",
    wednesday: "wed",
    thursday: "thu",
    friday: "fri",
    saturday: "sat",
  };

  const full = normalizeDay(fullDay);
  const short = map[full] || "";
  return short ? [full, short] : [full];
}

function isProviderAvailable(providerDoc, scheduleDate, scheduleTime) {
  const av = providerDoc?.provider?.availability;
  if (!av) return false;

  const workingDaysRaw = Array.isArray(av.workingDays) ? av.workingDays : [];
  const workingDays = workingDaysRaw.map(normalizeDay);

  const fromTime = String(av.fromTime || "").trim();
  const toTime = String(av.toTime || "").trim();

  if (!workingDays.length || !fromTime || !toTime) return false;
  if (!isValidTimeStr(fromTime) || !isValidTimeStr(toTime)) return false;

  const fullDay = dayNameFromDateStr(scheduleDate);
  const acceptable = expandDayAliases(fullDay);

  const dayOk = acceptable.some((d) => workingDays.includes(d));
  if (!dayOk) return false;

  const t = timeToMinutes(scheduleTime);
  const from = timeToMinutes(fromTime);
  const to = timeToMinutes(toTime);

  return t >= from && t <= to;
}

// ✅ block past date/time
function isPastSchedule(dateStr, timeStr) {
  const now = new Date();
  const chosen = new Date(`${dateStr}T${timeStr}:00`);
  return chosen.getTime() < now.getTime();
}

// ✅ common status helpers
function toStatus(s) {
  return String(s || "").trim().toLowerCase();
}

// ✅ User creates booking (scheduleDate + scheduleTime + availability check)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { providerId, category, scheduleDate, scheduleTime } = req.body;

    if (!providerId || !category) {
      return res.status(400).json({ message: "providerId and category required" });
    }

    if (!isValidDateStr(scheduleDate) || !isValidTimeStr(scheduleTime)) {
      return res.status(400).json({
        message: "scheduleDate (YYYY-MM-DD) and scheduleTime (HH:MM) required",
      });
    }

    // ✅ Past date/time block
    if (isPastSchedule(String(scheduleDate).trim(), String(scheduleTime).trim())) {
      return res.status(400).json({ message: "Please choose the correct date/time ❌" });
    }

    const user = await User.findById(req.userId).select("role name mobile currentLocation");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "user") return res.status(403).json({ message: "Only users can book" });

    const provider = await User.findOne({ _id: providerId, role: "provider" }).select(
      "name mobile role provider.businessLocation provider.availability"
    );

    if (!provider || provider.role !== "provider") {
      return res.status(404).json({ message: "Provider not found" });
    }

    // ✅ availability check
    const okAvail = isProviderAvailable(provider, scheduleDate, scheduleTime);
    if (!okAvail) {
      return res.status(400).json({ message: "Provider not available on that day/time ❌" });
    }

    if (!user.currentLocation?.lat || !user.currentLocation?.lng) {
      return res.status(400).json({ message: "User location not set" });
    }

    if (!provider.provider?.businessLocation?.lat || !provider.provider?.businessLocation?.lng) {
      return res.status(400).json({ message: "Provider business location not set" });
    }

    const uLat = user.currentLocation.lat;
    const uLng = user.currentLocation.lng;
    const pLat = provider.provider.businessLocation.lat;
    const pLng = provider.provider.businessLocation.lng;

    const dist = distanceKm(uLat, uLng, pLat, pLng);
    const avgSpeed = 30;
    const eta = dist / avgSpeed;

    const booking = await Booking.create({
      userId: user._id,
      providerId: provider._id,
      category,

      scheduleDate: String(scheduleDate).trim(),
      scheduleTime: String(scheduleTime).trim(),

      userSnapshot: {
        name: user.name,
        mobile: user.mobile,
        locationLabel: user.currentLocation.label || "",
        lat: uLat,
        lng: uLng,
      },

      providerSnapshot: {
        name: provider.name,
        mobile: provider.mobile,
        businessLabel: provider.provider.businessLocation.label || "",
        lat: pLat,
        lng: pLng,
      },

      distanceKm: Number(dist.toFixed(2)),
      etaHours: Number(eta.toFixed(2)),
    });

    return res.json({ ok: true, booking });
  } catch (e) {
    console.error("BOOKING CREATE ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ User: get my bookings (supports optional ?status=pending)
router.get("/user", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("role");
    if (!me || me.role !== "user") return res.status(403).json({ message: "Only users" });

    const status = req.query.status ? toStatus(req.query.status) : "";
    const filter = { userId: req.userId };
    if (status) filter.status = status;

    const list = await Booking.find(filter).sort({ createdAt: -1 });
    return res.json({ ok: true, bookings: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ User cancels booking (ALLOW pending + accepted)
router.put("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;

    const me = await User.findById(req.userId).select("role name");
    if (!me || me.role !== "user") return res.status(403).json({ message: "Only users" });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const st = toStatus(booking.status);

    // ✅ can cancel only pending or accepted
    if (!["pending", "accepted"].includes(st)) {
      return res.status(400).json({
        message: `Only pending/accepted bookings can be cancelled (current: ${booking.status})`,
      });
    }

    booking.status = "cancelled";
    booking.cancelledBy = "user";
    booking.cancelReason = String(reason || "").trim();
    booking.cancelledAt = new Date();

    await booking.save();

    console.log(`🔴 ALERT to Provider(${booking.providerId}): Booking ${booking._id} cancelled by user`);

    return res.json({ ok: true, booking, message: "Booking cancelled ✅" });
  } catch (e) {
    console.error("CANCEL ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ User: delete only rejected bookings
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (toStatus(booking.status) !== "rejected") {
      return res.status(400).json({ message: "Only rejected bookings can be deleted" });
    }

    await booking.deleteOne();
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ User completes accepted booking + rating + review
router.put("/:id/complete", requireAuth, async (req, res) => {
  try {
    const { rating, review } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (toStatus(booking.status) !== "accepted") {
      return res.status(400).json({ message: "Only accepted bookings can be completed" });
    }

    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 to 5" });
    }

    booking.status = "completed";
    booking.rating = numRating;
    booking.review = String(review || "").trim();
    await booking.save();

    const provider = await User.findById(booking.providerId).select(
      "role provider.ratingAvg provider.ratingCount"
    );

    if (provider && provider.role === "provider" && provider.provider) {
      const oldAvg = Number(provider.provider.ratingAvg || 0);
      const oldCount = Number(provider.provider.ratingCount || 0);

      const newCount = oldCount + 1;
      const newAvg = (oldAvg * oldCount + numRating) / newCount;

      provider.provider.ratingAvg = Number(newAvg.toFixed(2));
      provider.provider.ratingCount = newCount;
      await provider.save();
    }

    return res.json({ ok: true, booking });
  } catch (e) {
    console.error("COMPLETE ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Provider sees pending bookings (ONLY pending)
router.get("/provider/pending", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("role");
    if (!me || me.role !== "provider") {
      return res.status(403).json({ message: "Only providers can view this" });
    }

    const list = await Booking.find({ providerId: req.userId, status: "pending" }).sort({
      createdAt: -1,
    });

    return res.json({ ok: true, bookings: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ NEW: Provider "Pending Works" (accepted only)
router.get("/provider/accepted", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("role");
    if (!me || me.role !== "provider") {
      return res.status(403).json({ message: "Only providers can view this" });
    }

    const list = await Booking.find({ providerId: req.userId, status: "accepted" }).sort({
      createdAt: -1,
    });

    return res.json({ ok: true, bookings: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Provider accept/reject
router.put("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!["accepted", "rejected"].includes(toStatus(status))) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.providerId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not your booking" });
    }

    // prevent changes after cancelled/completed
    if (["cancelled", "completed"].includes(toStatus(booking.status))) {
      return res.status(400).json({ message: `Cannot update a ${booking.status} booking` });
    }

    const st = toStatus(status);

    if (st === "rejected") {
      const r = String(reason || "").trim();
      if (!r) return res.status(400).json({ message: "Reject reason required" });
      booking.rejectReason = r;
    } else {
      booking.rejectReason = "";
    }

    booking.status = st;
    await booking.save();

    return res.json({ ok: true, booking });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Provider: work history (COMPLETED only)  <-- as per your requirement
router.get("/provider/history", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("role");
    if (!me || me.role !== "provider") {
      return res.status(403).json({ message: "Only providers can view this" });
    }

    const list = await Booking.find({
      providerId: req.userId,
      status: "completed",
    }).sort({ createdAt: -1 });

    return res.json({ ok: true, bookings: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Provider: pending works (accepted + cancelledBy user)
router.get("/provider/pending-works", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("role");
    if (!me || me.role !== "provider") {
      return res.status(403).json({ message: "Only providers can view this" });
    }

    const list = await Booking.find({
      providerId: req.userId,
      $or: [
        { status: "accepted" },
        { status: "cancelled", cancelledBy: "user" },
      ],
    }).sort({ updatedAt: -1, createdAt: -1 });

    return res.json({ ok: true, bookings: list });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Provider: delete only cancelled bookings (cleanup in Pending Works)
router.delete("/provider/:id", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select("role");
    if (!me || me.role !== "provider") {
      return res.status(403).json({ message: "Only providers" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // must belong to this provider
    if (String(booking.providerId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // only cancelled allowed
    if (String(booking.status) !== "cancelled") {
      return res.status(400).json({ message: "Only cancelled bookings can be deleted" });
    }

    await booking.deleteOne();
    return res.json({ ok: true });
  } catch (e) {
    console.error("PROVIDER CANCEL DELETE ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;