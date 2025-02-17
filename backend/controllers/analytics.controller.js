import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// Function to fetch total users, total products, total sales, and total revenue
export const getAnalytics = async () => {

    // Count total users in the database
    const totalUsers = await User.countDocuments();

    // Count total products in the database
    const totalProducts = await Product.countDocuments();

    // Aggregate order data to calculate total sales and total revenue
    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null, // Groups all orders together into one result
                totalSales: { $sum: 1 }, // Counts total number of orders
                totalRevenue: { $sum: "$totalAmount" } // Sums the totalAmount field from the Order model
            }
        }
    ]);

    // Destructure the data from the salesData array, provide default values if no data exists
    const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };

    // Return the analytics data as an object
    return {
        user: totalUsers,
        product: totalProducts,
        totalSales,
        totalRevenue
    };
};

// Function to fetch daily sales and revenue between startDate and endDate
export const getDailySaleData = async (startDate, endDate) => {
    try {
        const dailySalesData = await Order.aggregate([
            {
                // Filter orders based on createdAt date range
                $match: {
                    createdAt: {
                        $gte: startDate, // Greater than or equal to startDate
                        $lt: endDate     // Less than endDate
                    }
                }
            },
            {
                // Group orders by date and calculate total sales and revenue per day
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { _id: 1 } // Sort results in ascending order (oldest to newest)
            }
        ]);

        // Example output of dailySalesData:
        // [
        //     { "_id": "2024-02-10", "sales": 5, "revenue": 500 },
        //     { "_id": "2024-02-08", "sales": 3, "revenue": 300 },
        //     { "_id": "2024-02-09", "sales": 7, "revenue": 700 }
        // ]

        // Generate an array of all dates between startDate and endDate
        const dateArray = getDateRange(startDate, endDate);

        // Map through each date and return sales & revenue (default to 0 if data is missing)
        return dateArray.map(date => {
            const foundData = dailySalesData.find(item => item._id === date);
            return {
                date, // Current date in YYYY-MM-DD format
                sales: foundData?.sales || 0, // Use 0 if no sales data exists
                revenue: foundData?.revenue || 0 // Use 0 if no revenue data exists
            };
        });
    } catch (error) {
        console.log("Error in getDailySaleData: ", error.message);
        throw error;
    }
};

// Function to generate an array of dates between startDate and endDate
function getDateRange(startDate, endDate) {

    const dates = []; // Array to store dates
    let currentDate = new Date(startDate); // Convert startDate to Date object

    while (currentDate <= endDate) {

        // Convert date to YYYY-MM-DD format and push to array
        dates.push(currentDate.toISOString().split('T')[0]);

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates; // Return array of dates
}
