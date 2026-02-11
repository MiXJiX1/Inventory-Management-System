
import { Request, Response } from "express";
import prisma from "../config/db";
import { z } from "zod";

const expenseSchema = z.object({
    description: z.string().min(1),
    amount: z.coerce.number().min(0),
    type: z.string().optional(),
    date: z.string().datetime().optional(),
});

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const { startDate, endDate } = req.query;

        const where: any = {};
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.expense.count({ where });

        res.json({
            data: expenses,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching expenses", error });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const data = expenseSchema.parse(req.body);

        const expense = await prisma.expense.create({
            data: {
                description: data.description,
                amount: data.amount,
                type: data.type || "Other",
                date: data.date ? new Date(data.date) : new Date(),
            }
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: "Error creating expense", error });
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const expenseId = Array.isArray(id) ? id[0] : id;

        if (!expenseId) {
            return res.status(400).json({ message: "Expense ID is required" });
        }

        await prisma.expense.delete({ where: { id: expenseId } });
        res.json({ message: "Expense deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting expense", error });
    }
};
