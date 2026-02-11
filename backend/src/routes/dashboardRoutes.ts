import { Router } from "express";
import { getDashboardStats, getProfitLossStats } from "../controllers/dashboardController";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

router.get("/summary", authenticateToken, getDashboardStats);
router.get("/profit-loss", authenticateToken, getProfitLossStats);

export default router;
