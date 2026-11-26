import { Router } from "express";
import { registerStudent, login, getCurrentUser } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", registerStudent);
router.post("/login", loginLimiter, login);
router.get("/me", protect, getCurrentUser);

export default router;
