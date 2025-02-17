import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getAnalytics, getDailySaleData } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/analytics", protectRoute, adminRoute, async (req, res) => {
    try {
        //this will return the totalUser,totalProducts,totalSales and totalRevenue
        const analyticsData = await getAnalytics();

        //we have to calculate the total sales & total revenue for the last 7 days
        const endDate = new Date(); //Get the current date
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); //Get the date 7 days ago

        const dailySalesData = await getDailySaleData(startDate, endDate);

        res.json({ analyticsData, dailySalesData });

    } catch (error) {
        console.log("Error in Analytics Route: ", error.message);
        res.status(500).json({ message: error.message });
    }
})

export default router;