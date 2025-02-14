import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.post("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
