
import { Router } from "express";
import { getAuditLogs } from "../controllers/auditController";
import { authenticateToken, authorizeRole } from "../middlewares/auth";

const router = Router();

router.get("/", authenticateToken, authorizeRole("ADMIN"), getAuditLogs);

export default router;
