
import { Router } from "express";
import { getExpenses, createExpense, deleteExpense } from "../controllers/expenseController";
import { authenticateToken, authorizeRole } from "../middlewares/auth";

const router = Router();

router.get("/", authenticateToken, getExpenses);
router.post("/", authenticateToken, authorizeRole("ADMIN"), createExpense);
router.delete("/:id", authenticateToken, authorizeRole("ADMIN"), deleteExpense);

export default router;
