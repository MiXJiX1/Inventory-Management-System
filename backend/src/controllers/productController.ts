import { Request, Response } from "express";
import prisma from "../config/db";
import { z } from "zod";
import { logAction } from "../services/auditService";

const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    category: z.string().optional(), // Keep optional for backward compatibility or direct string
    categoryId: z.string().optional(), // New relation
    image: z.string().optional(),
    price: z.coerce.number().min(0),
    costPrice: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().int().min(0),
    minStock: z.coerce.number().int().min(0).optional(),
});

export const getProducts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || "";
        const category = (req.query.category as string) || "";
        const status = (req.query.status as string) || "";
        const sortBy = (req.query.sortBy as string) || "createdAt";
        const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

        const where: any = {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ],
        };

        if (category) {
            where.category = { equals: category, mode: "insensitive" };
        }

        if (status === 'low_stock') {
            where.quantity = {
                lte: prisma.product.fields.minStock,
                gt: 0
            };
        } else if (status === 'out_of_stock') {
            where.quantity = 0;
        }

        const total = await prisma.product.count({ where });
        const products = await prisma.product.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: { Category: true } // Include category details
        });

        const productsWithStatus = products.map((p: any) => {
            let status = "in_stock";
            if (p.quantity === 0) status = "out_of_stock";
            else if (p.quantity <= p.minStock) status = "low_stock";
            return { ...p, status };
        });

        res.json({
            data: productsWithStatus,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};

export const getProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id: id as string } });
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error fetching product", error });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const data = productSchema.parse(req.body);
        const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
        if (existingSku) return res.status(400).json({ message: "SKU already exists" });

        // Logic to handle category: If categoryId provided, use it. If category name provided, try to find or create?
        // For now, let's assume frontend sends categoryId. If legacy 'category' string is sent, we might want to map it.
        // Simple approach: Save both if possible, or prioritize categoryId.

        const product = await prisma.product.create({
            data: {
                ...data,
                category: data.category || "", // Fallback
            }
        });
        await logAction((req as any).user?.userId, "CREATE", "PRODUCT", product.id, { name: product.name, sku: product.sku });
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: "Error creating product", error });
    }
};

export const createProductsBatch = async (req: Request, res: Response) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Invalid products array" });
        }

        // Validate each product
        const validProducts = [];
        const errors = [];

        for (const p of products) {
            try {
                const data = productSchema.parse(p);
                // Check dupes logic could be here, or use skipDuplicates in createMany (but createMany doesn't return created records in all DBs/Prisma versions same way)
                // For simplicity/safety, we'll try to insert valid ones.
                // However, Prisma createMany doesn't support 'ON CONFLICT DO UPDATE' easily without raw query.
                // We will use check-then-create loop for better error report or just createMany with skipDuplicates if ID provided (but we use UUIDs)

                // Let's use createMany and hope for best? No, user wants feedback. 
                // Let's filter out existing SKUs first.

                const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
                if (!existing) {
                    validProducts.push(data);
                }
            } catch (e) {
                // skip invalid
            }
        }

        if (validProducts.length > 0) {
            await prisma.product.createMany({
                data: validProducts,
                skipDuplicates: true // In case of race condition
            });
            await logAction((req as any).user?.userId, "BATCH_CREATE", "PRODUCT", undefined, { count: validProducts.length });
        }

        res.status(201).json({ message: `Imported ${validProducts.length} products.` });
    } catch (error) {
        res.status(500).json({ message: "Error batch creating products", error });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log("updateProduct received body:", req.body);
        const data = productSchema.partial().parse(req.body);
        console.log("updateProduct parsed data:", data);

        // Check if SKU is being updated and conflicts
        if (data.sku) {
            const existing = await prisma.product.findFirst({ where: { sku: data.sku, NOT: { id: id as string } } });
            if (existing) return res.status(400).json({ message: "SKU already exists" });
        }

        // Variable to hold product name for logging
        let productName = "";

        let currentProduct: any = null; // Lifted scope for audit log

        // Transaction Logic
        const result = await prisma.$transaction(async (prisma) => {
            currentProduct = await prisma.product.findUnique({ where: { id: id as string } });
            if (!currentProduct) throw new Error("Product not found");

            productName = currentProduct.name;

            let transactionType: "IN" | "OUT" | "ADJUST" | null = null;
            let transactionQty = 0;

            if (data.quantity !== undefined && data.quantity !== currentProduct.quantity) {
                const diff = data.quantity - currentProduct.quantity;
                const reason = req.body.reason || "MANUAL"; // Frontend can send "SALE", "RESTOCK", "ADJUST"

                if (diff > 0) {
                    transactionType = "IN";
                    transactionQty = diff;
                } else {
                    transactionQty = Math.abs(diff);
                    if (reason === "ADJUST") {
                        transactionType = "ADJUST";
                    } else {
                        transactionType = "OUT"; // Default to OUT (Sale) for now, or we can make "ADJUST" default for manual edits
                    }
                }
            }

            const updatedProduct = await prisma.product.update({ where: { id: id as string }, data });

            if (transactionType && transactionQty > 0) {
                await prisma.transaction.create({
                    data: {
                        type: transactionType,
                        quantity: transactionQty,
                        productId: id as string,
                        priceSnapshot: updatedProduct.price,
                        costSnapshot: updatedProduct.costPrice
                    }
                });
            }

            return updatedProduct;
        });

        // Calculate actual changes
        const changes: Record<string, { old: any, new: any }> = {};
        if (currentProduct) {
            const keys = Object.keys(data) as Array<keyof typeof data>;
            keys.forEach(key => {
                const newValue = data[key];
                const oldValue = currentProduct[key as keyof typeof currentProduct];

                // Simple equality check (strict)
                // Handle standard types. For objects/dates, might need better check, 
                // but Product model is mostly primitives.
                if (newValue !== undefined && newValue !== oldValue) {
                    changes[key] = { old: oldValue, new: newValue };
                }
            });
        }

        await logAction((req as any).user?.userId, "UPDATE", "PRODUCT", id as string, {
            productName: productName,
            updates: changes, // Now contains { old, new } objects
            note: req.body.note
        });

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message || "Error updating product", error });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productId = Array.isArray(id) ? id[0] : id; // Handle potential array

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ message: "Product not found" });

        await prisma.product.delete({ where: { id: productId } });
        await logAction((req as any).user?.userId, "DELETE", "PRODUCT", productId, { name: product?.name, sku: product?.sku });
        res.json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
};
