import { Router } from "express";
import { clearAllData } from "../controllers/adminController";
import { authenticateToken, authorizeRole } from "../middlewares/auth";

const router = Router();

router.post("/clear-data", authenticateToken, authorizeRole("ADMIN"), clearAllData);

export default router;
