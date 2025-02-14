import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts, getRecommendedProducts } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/recommendation", getRecommendedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.post("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
