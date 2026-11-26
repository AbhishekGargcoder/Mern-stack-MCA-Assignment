import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const createAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env.");
  }
  if (ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 72) {
    throw new Error("ADMIN_PASSWORD must be 12-72 characters long.");
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const [existing] = await pool.execute(
    "SELECT id, role FROM users WHERE email = ?",
    [email]
  );

  if (existing.length > 0) {
    throw new Error(
      existing[0].role === "admin"
        ? "An admin with this email already exists."
        : "This email belongs to a student. Choose another admin email."
    );
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.execute(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, 'admin')`,
    [ADMIN_NAME.trim(), email, hashedPassword]
  );

  console.log(`Admin account created for ${email}.`);
};

try {
  await createAdmin();
} catch (error) {
  console.error("Admin creation failed:", error.message);
} finally {
  await pool.end();
}