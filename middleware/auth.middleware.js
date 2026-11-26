import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Provide a Bearer token."
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }

  const userId = Number(decoded.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(401).json({ success: false, message: "Invalid token subject." });
  }

  // Fetch the current role from the database instead of trusting a potentially stale JWT role.
  const [rows] = await pool.execute(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    [userId]
  );

  if (rows.length === 0) {
    return res.status(401).json({ success: false, message: "Account no longer exists." });
  }

  req.user = rows[0];
  next();
});

export default protect;
