import { Request, Response } from "express";
import prisma from "../config/db";
import { z } from "zod";
import { logAction } from "../services/auditService";
import { sendLineNotification } from "../services/lineNotifyService";

const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    category: z.string().optional(),
    categoryId: z.string().optional(),
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
            include: { Category: true }
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



        const product = await prisma.product.create({
            data: {
                ...data,
                category: data.category || "",
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


        const validProducts = [];
        const errors = [];

        for (const p of products) {
            try {
                const data = productSchema.parse(p);



                const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
                if (!existing) {
                    validProducts.push(data);
                }
            } catch (e) {

            }
        }

        if (validProducts.length > 0) {
            await prisma.product.createMany({
                data: validProducts,
                skipDuplicates: true
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


        if (data.sku) {
            const existing = await prisma.product.findFirst({ where: { sku: data.sku, NOT: { id: id as string } } });
            if (existing) return res.status(400).json({ message: "SKU already exists" });
        }



        const currentProduct = await prisma.product.findUnique({ where: { id: id as string } });
        if (!currentProduct) return res.status(404).json({ message: "Product not found" });


        let productName = "";
        let transactionType: "IN" | "OUT" | "ADJUST" | null = null;
        let transactionQty = 0;

        const result = await prisma.$transaction(async (prisma) => {
            productName = currentProduct.name;


            if (data.quantity !== undefined && data.quantity !== currentProduct.quantity) {
                const diff = data.quantity - currentProduct.quantity;
                const reason = req.body.reason || "MANUAL";

                if (diff > 0) {
                    transactionType = "IN";
                    transactionQty = diff;
                } else {
                    transactionQty = Math.abs(diff);
                    if (reason === "ADJUST") {
                        transactionType = "ADJUST";
                    } else {
                        transactionType = "OUT";
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

        // Check for Low Stock after update
        if (result.quantity <= (result.minStock || 0)) {
            const message = `\n⚠️ Low Stock Alert!\nProduct: ${result.name}\nSKU: ${result.sku}\nRemaining: ${result.quantity}`;
            // Intentionally not awaiting to avoid blocking the response
            sendLineNotification(message).catch(err => console.error("Failed to send Line Notify:", err));
        }

        const changes: Record<string, { old: any, new: any }> = {};
        if (currentProduct) {
            const keys = Object.keys(data) as Array<keyof typeof data>;
            keys.forEach(key => {
                const newValue = data[key];
                const oldValue = currentProduct[key as keyof typeof currentProduct];

                if (newValue !== undefined && newValue !== oldValue) {
                    changes[key] = { old: oldValue, new: newValue };
                }
            });
        }

        await logAction((req as any).user?.userId, "UPDATE", "PRODUCT", id as string, {
            productName: productName,
            updates: changes,
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
        const productId = Array.isArray(id) ? id[0] : id;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ message: "Product not found" });

        await prisma.product.delete({ where: { id: productId } });
        await logAction((req as any).user?.userId, "DELETE", "PRODUCT", productId, { name: product?.name, sku: product?.sku });
        res.json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
};
