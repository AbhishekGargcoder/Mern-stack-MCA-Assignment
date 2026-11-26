import { Router } from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  getAllStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getMyProfile,
  updateMyProfile,
  updateMyPassword
} from "../controllers/student.controller.js";

const router = Router();

// Apply authentication to every student route.
router.use(protect);

// Student self-service routes.
router.get("/me", authorize("student"), getMyProfile);
router.patch("/me", authorize("student"), updateMyProfile);
router.patch("/me/password", authorize("student"), updateMyPassword);

// Admin-only student management routes.
router.get("/", authorize("admin"), getAllStudents);
router.post("/", authorize("admin"), addStudent);
router.get("/:id", authorize("admin"), getStudentById);
router.put("/:id", authorize("admin"), updateStudent);
router.delete("/:id", authorize("admin"), deleteStudent);

export default router;