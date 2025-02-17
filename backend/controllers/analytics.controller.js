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