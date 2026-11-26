import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeOptionalString
} from "../utils/validators.js";

export const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, course } = req.body;

  if (!isValidName(name) || !isValidEmail(email) || !isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid name, email and password (8-72 characters)."
    });
  }

  const cleanPhone = normalizeOptionalString(phone, 20);
  const cleanCourse = normalizeOptionalString(course, 100);
  if (cleanPhone === undefined || cleanCourse === undefined) {
    return res.status(400).json({ success: false, message: "Invalid phone or course." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, phone, course, role)
       VALUES (?, ?, ?, ?, ?, 'student')`,
      [name.trim(), normalizedEmail, hashedPassword, cleanPhone, cleanCourse]
    );

    return res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      studentId: result.insertId
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || typeof password !== "string" || !password) {
    return res.status(400).json({ success: false, message: "Valid email and password are required." });
  }

  const [rows] = await pool.execute(
    "SELECT id, name, email, password, role FROM users WHERE email = ?",
    [email.trim().toLowerCase()]
  );

  if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const user = rows[0];
  const token = generateToken(user);

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
