import { Router } from "express";
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, createProductsBatch } from "../controllers/productController";
import { authenticateToken, authorizeRole } from "../middlewares/auth";

const router = Router();

router.get("/", authenticateToken, getProducts);
router.get("/:id", authenticateToken, getProduct);
router.post("/", authenticateToken, authorizeRole("ADMIN"), createProduct);
router.post("/batch", authenticateToken, authorizeRole("ADMIN"), createProductsBatch);
router.patch("/:id", authenticateToken, updateProduct);
router.delete("/:id", authenticateToken, authorizeRole("ADMIN"), deleteProduct);

export default router;
