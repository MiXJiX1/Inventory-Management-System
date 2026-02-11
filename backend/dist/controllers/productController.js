"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    sku: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    price: zod_1.z.number().min(0),
    quantity: zod_1.z.number().int().min(0),
    minStock: zod_1.z.number().int().min(0).default(10),
});
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const category = req.query.category || "";
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
        const where = {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ],
        };
        if (category) {
            where.category = { equals: category, mode: "insensitive" };
        }
        const total = await db_1.default.product.count({ where });
        const products = await db_1.default.product.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        });
        const productsWithStatus = products.map((p) => {
            let status = "in_stock";
            if (p.quantity === 0)
                status = "out_of_stock";
            else if (p.quantity <= p.minStock)
                status = "low_stock";
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
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};
exports.getProducts = getProducts;
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await db_1.default.product.findUnique({ where: { id: id } });
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching product", error });
    }
};
exports.getProduct = getProduct;
const createProduct = async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const existingSku = await db_1.default.product.findUnique({ where: { sku: data.sku } });
        if (existingSku)
            return res.status(400).json({ message: "SKU already exists" });
        const product = await db_1.default.product.create({ data });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(400).json({ message: "Error creating product", error });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = productSchema.partial().parse(req.body);
        // Check if SKU is being updated and conflicts
        if (data.sku) {
            const existing = await db_1.default.product.findFirst({ where: { sku: data.sku, NOT: { id: id } } });
            if (existing)
                return res.status(400).json({ message: "SKU already exists" });
        }
        const product = await db_1.default.product.update({ where: { id: id }, data });
        res.json(product);
    }
    catch (error) {
        res.status(400).json({ message: "Error updating product", error });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.product.delete({ where: { id: id } });
        res.json({ message: "Product deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
};
exports.deleteProduct = deleteProduct;
