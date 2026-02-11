
import { Router } from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController";
import { authenticateToken, authorizeRole } from "../middlewares/auth";

const router = Router();

router.get("/", authenticateToken, getCategories);
router.post("/", authenticateToken, authorizeRole("ADMIN"), createCategory);
router.put("/:id", authenticateToken, authorizeRole("ADMIN"), updateCategory);
router.delete("/:id", authenticateToken, authorizeRole("ADMIN"), deleteCategory);

export default router;
