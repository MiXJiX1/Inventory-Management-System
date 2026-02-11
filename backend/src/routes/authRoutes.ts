import { Router } from "express";
import { login, logout, me, refreshToken, register } from "../controllers/authController";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.get("/me", authenticateToken, me);

export default router;
