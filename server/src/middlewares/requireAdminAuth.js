import jwt from "jsonwebtoken";

export default function requireAdminAuth(req, res, next) {
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