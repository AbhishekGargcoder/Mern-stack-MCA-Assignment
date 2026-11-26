import "dotenv/config";
import express from "express";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const requiredEnv = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

const app = express();

app.disable("x-powered-by");

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Student Management API is running."
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

try {
  await pool.query("SELECT 1");
  console.log("MySQL connected successfully.");

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Unable to connect to MySQL:", error.message);
  process.exit(1);
}

// const shutdown = async (signal) => {
//   console.log(`${signal} received. Closing MySQL pool...`);
//   await pool.end();
//   process.exit(0);
// };

// process.on("SIGINT", () => shutdown("SIGINT"));
// process.on("SIGTERM", () => shutdown("SIGTERM"));
