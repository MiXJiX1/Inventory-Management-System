import express, { Express, Request, Response } from "express";
import cors from "cors";
import prisma from "./config/db";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("Inventory Management System API");
});

import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

import auditRoutes from "./routes/auditRoutes";

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/audit-logs", auditRoutes);

import adminRoutes from "./routes/adminRoutes";
app.use("/admin", adminRoutes);

import expenseRoutes from "./routes/expenseRoutes";
app.use("/expenses", expenseRoutes);


app.listen(port, async () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    try {
        await prisma.$connect();
        console.log("[server]: Database connected successfully");
    } catch (error) {
        console.error("[server]: Database connection failed", error);
    }
});
