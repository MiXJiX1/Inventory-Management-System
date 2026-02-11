
import { Request, Response } from "express";
import prisma from "../config/db";

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const action = (req.query.action as string) || "";
        const userId = (req.query.userId as string) || "";

        const search = (req.query.search as string) || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { details: { contains: search, mode: "insensitive" } },
                { entityId: { contains: search, mode: "insensitive" } },
                { action: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } }
            ];
        }

        if (action) {
            where.action = action;
        }

        if (userId) {
            where.userId = userId;
        }

        const total = await prisma.auditLog.count({ where });
        const logs = await prisma.auditLog.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                }
            }
        });

        res.json({
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching audit logs", error });
    }
};
