
import { Request, Response } from "express";
import prisma from "../config/db";
import { z } from "zod";
import { logAction } from "../services/auditService";

const categorySchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
});

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name } = categorySchema.parse(req.body);
        const existing = await prisma.category.findUnique({ where: { name } });
        if (existing) return res.status(400).json({ message: "Category already exists" });

        const category = await prisma.category.create({ data: { name } });

        await logAction((req as any).user?.userId, "CREATE", "CATEGORY", category.id, { name });

        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: "Error creating category", error });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = categorySchema.parse(req.body);

        const existing = await prisma.category.findUnique({ where: { name } });
        if (existing && existing.id !== id) return res.status(400).json({ message: "Category name already exists" });

        const category = await prisma.category.update({
            where: { id: id as string },
            data: { name }
        });

        await logAction((req as any).user?.userId, "UPDATE", "CATEGORY", category.id, { name });

        res.json(category);
    } catch (error) {
        res.status(400).json({ message: "Error updating category", error });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const categoryId = id as string;

        // Check availability
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!category) return res.status(404).json({ message: "Category not found" });

        if (category._count.products > 0) {
            return res.status(400).json({ message: "Cannot delete category with associated products" });
        }

        await prisma.category.delete({ where: { id: categoryId } });

        await logAction((req as any).user?.userId, "DELETE", "CATEGORY", categoryId, { name: category.name });

        res.json({ message: "Category deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting category", error });
    }
};
