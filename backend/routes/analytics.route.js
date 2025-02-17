import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/analytics", protectRoute, adminRoute, async (req, res) => {
    try {

        const analyticsData = await getAnalytics();

    } catch (error) {

    }
})

export default router;