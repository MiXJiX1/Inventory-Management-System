"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../utils/auth");
const jwt_1 = require("../utils/jwt");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const register = async (req, res) => {
    try {
        const { email, password, name } = registerSchema.parse(req.body);
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await db_1.default.user.create({
            data: { email, password: hashedPassword, name },
        });
        res.status(201).json({ message: "User created successfully", userId: user.id });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user || !(await (0, auth_1.comparePassword)(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        // Store refresh token in DB
        await db_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
        // Send cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000, // 15 mins
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({ message: "Login successful", user: { id: user.id, email: user.email, name: user.name } });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" });
    }
};
exports.login = login;
const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await db_1.default.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
};
exports.logout = logout;
const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token)
        return res.status(401).json({ message: "No refresh token" });
    try {
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        const storedToken = await db_1.default.refreshToken.findUnique({ where: { token } });
        if (!storedToken)
            return res.status(403).json({ message: "Invalid refresh token" });
        const newAccessToken = (0, jwt_1.generateAccessToken)(payload.userId);
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
        });
        res.json({ message: "Token refreshed" });
    }
    catch (error) {
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};
exports.refreshToken = refreshToken;
const me = async (req, res) => {
    try {
        // User is attached by authenticateToken middleware
        const userId = req.user.userId;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true }
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.me = me;
