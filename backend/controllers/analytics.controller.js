import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAnalytics = async () => {

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const salesData = await Order.aggregate([
        {
            $group: {
                _id: null, //Group everything together (one result) 
                totalSales: { $sum: 1 }, //	Counts total documents (total orders)
                totalRevenue: { $sum: "$totalAmount" } //    Sums totalAmount field from order model    
            }
        }
    ])
    const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 } //Destructure the data from the salesData array
    //Return the data as an object
    return {
        user: totalUsers,
        product: totalProducts,
        totalSales,
        totalRevenue
    }
}
//this will return last 7 days data for chart in the dashboard
export const getDailySaleData = async (startDate, endDate) => {
    const dailySalesData = await Order.aggregate([
        {
            //filter the data between startDate and endDate
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                sales: { $sum: 1 },
                revenue: { $sum: "$totalAmount" }
            }
        }, {
            $sort: { _id: 1 } //1 means ascending order (oldest to newest)
        }
    ])
}
//example
// [
//     { "_id": "2024-02-10", "sales": 5, "revenue": 500 },
//     { "_id": "2024-02-08", "sales": 3, "revenue": 300 },
//     { "_id": "2024-02-09", "sales": 7, "revenue": 700 }
//   ]

function getDateRange(startDate, endDate) {
    const dates = [];

    let currentDate = startDate;

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        //example:- 2024-02-10T00:00:00.000Z => 2024-02-10

        currentDate.setDate(currentDate.getDate() + 1);
        //example:- 2024-02-10 => 2024-02-11 ~ increase & set the currentDate 
    }
}
