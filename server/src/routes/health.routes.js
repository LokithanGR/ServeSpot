import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "ServeSpot API",
    time: new Date().toISOString(),
  });
});

export default router;
