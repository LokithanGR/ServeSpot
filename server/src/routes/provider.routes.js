import express from "express";
import User from "../models/User.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

router.get("/search", requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const radius = Number(req.query.radius || 10);

    if (!category) {
      return res.status(400).json({ message: "Category required" });
    }

    const user = await User.findById(req.userId).select(
      "currentLocation"
    );

    if (!user?.currentLocation?.lat || !user?.currentLocation?.lng) {
      return res
        .status(400)
        .json({ message: "User location not set" });
    }

    const { lat: uLat, lng: uLng } = user.currentLocation;

    const providers = await User.find({
      role: "provider",
      "provider.category": category,
      "provider.businessLocation.lat": { $exists: true },
      "provider.businessLocation.lng": { $exists: true },
    }).select(
      `
        name
        photo
        mobile
        provider.category
        provider.businessLocation
        provider.experience
        provider.ratingAvg
        provider.ratingCount
        provider.availability
      `
    );

    const nearby = providers
      .map((p) => {
        const loc = p.provider?.businessLocation;

        if (!loc?.lat || !loc?.lng) return null;

        const d = distanceKm(
          uLat,
          uLng,
          loc.lat,
          loc.lng
        );

        return {
          id: p._id,

          name: p.name,
          photo: p.photo || "",
          mobile: p.mobile || "",

          category: p.provider?.category || "",
          experience: p.provider?.experience || "",

          businessLocation: loc,

          ratingAvg: Number(p.provider?.ratingAvg || 0),
          ratingCount: Number(p.provider?.ratingCount || 0),

          availability: {
            workingDays:
              p.provider?.availability?.workingDays || [],
            fromTime:
              p.provider?.availability?.fromTime || "",
            toTime:
              p.provider?.availability?.toTime || "",
          },

          distanceKm: Number(d.toFixed(2)),
        };
      })
      .filter(Boolean)
      .filter((p) => p.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({
      ok: true,
      count: nearby.length,
      providers: nearby,
    });
  } catch (err) {
    console.error("PROVIDER SEARCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
