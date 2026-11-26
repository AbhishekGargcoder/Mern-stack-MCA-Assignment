import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeOptionalString
} from "../utils/validators.js";

const publicStudentColumns = "id, name, email, phone, course, created_at, updated_at";

export const getAllStudents = asyncHandler(async (req, res) => {
  const [students] = await pool.execute(
    `SELECT ${publicStudentColumns} FROM users WHERE role = 'student' ORDER BY id DESC`
  );

  res.status(200).json({ success: true, count: students.length, students });
});

export const getStudentById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.execute(
    `SELECT ${publicStudentColumns} FROM users WHERE id = ? AND role = 'student'`,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  res.status(200).json({ success: true, student: rows[0] });
});

export const addStudent = asyncHandler(async (req, res) => {
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

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, phone, course, role)
       VALUES (?, ?, ?, ?, ?, 'student')`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword, cleanPhone, cleanCourse]
    );

    res.status(201).json({
      success: true,
      message: "Student created successfully.",
      studentId: result.insertId
    });
  } catch (error) {
      return res.status(409).json({ success: false, message: "Email already exists." });
  }
});

export const updateStudent = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, course } = req.body;

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid student ID." });
  }
  if (!isValidName(name) || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Valid name and email are required." });
  }

  const cleanPhone = normalizeOptionalString(phone, 20);
  const cleanCourse = normalizeOptionalString(course, 100);
  if (cleanPhone === undefined || cleanCourse === undefined) {
    return res.status(400).json({ success: false, message: "Invalid phone or course." });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE users
       SET name = ?, email = ?, phone = ?, course = ?
       WHERE id = ? AND role = 'student'`,
      [name.trim(), email.trim().toLowerCase(), cleanPhone, cleanCourse, id]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'student'",
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Student not found." });
      }
    }

    res.status(200).json({ success: true, message: "Student updated successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email already exists." });
    }
    throw error;
  }
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid student ID." });
  }

  const [result] = await pool.execute(
    "DELETE FROM users WHERE id = ? AND role = 'student'",
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  res.status(200).json({ success: true, message: "Student deleted successfully." });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ${publicStudentColumns} FROM users WHERE id = ? AND role = 'student'`,
    [req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "Student profile not found." });
  }

  res.status(200).json({ success: true, student: rows[0] });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedKeys = ["name", "phone", "course"];
  const suppliedKeys = Object.keys(req.body || {});
  if (suppliedKeys.length === 0 || suppliedKeys.some((key) => !allowedKeys.includes(key))) {
    return res.status(400).json({
      success: false,
      message: "Only name, phone and course can be updated. Provide at least one field."
    });
  }

  const updates = {};
  if ("name" in req.body) {
    if (!isValidName(req.body.name)) {
      return res.status(400).json({ success: false, message: "Name must be 2-100 characters." });
    }
    updates.name = req.body.name.trim();
  }
  if ("phone" in req.body) {
    updates.phone = normalizeOptionalString(req.body.phone, 20);
    if (updates.phone === undefined) {
      return res.status(400).json({ success: false, message: "Invalid phone." });
    }
  }
  if ("course" in req.body) {
    updates.course = normalizeOptionalString(req.body.course, 100);
    if (updates.course === undefined) {
      return res.status(400).json({ success: false, message: "Invalid course." });
    }
  }

  const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
  const values = [...Object.values(updates), req.user.id];

  const [result] = await pool.execute(
    `UPDATE users SET ${setClause} WHERE id = ? AND role = 'student'`,
    values
  );

  if (result.affectedRows === 0) {
    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'student'",
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }
  }

  res.status(200).json({ success: true, message: "Profile updated successfully." });
});

export const updateMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (typeof currentPassword !== "string" || !isValidPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: "Current password and a new password of 8-72 characters are required."
    });
  }

  const [rows] = await pool.execute(
    "SELECT password FROM users WHERE id = ? AND role = 'student'",
    [req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  const matches = await bcrypt.compare(currentPassword, rows[0].password);
  if (!matches) {
    return res.status(401).json({ success: false, message: "Current password is incorrect." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await pool.execute(
    "UPDATE users SET password = ? WHERE id = ? AND role = 'student'",
    [hashedPassword, req.user.id]
  );

  res.status(200).json({
    success: true,
    message: "Password updated. Please log in again on other devices."
  });
});