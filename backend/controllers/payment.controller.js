import { stripe } from "../lib/stripe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";

// Controller to create a checkout session
export const createCheckoutSession = async (req, res) => {
    try {
        // Extract products and couponCode from request body
        const { products, couponCode } = req.body;

        // Validate that products array is not empty
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Invalid or empty products array" });
        }

        let totalAmount = 0; // Store total price before applying any discount

        // Convert products into Stripe line items format
        const lineItems = products.map((product) => {
            const amount = Math.round(product.price * 100); // Convert price to cents (Stripe requires it)
            totalAmount += amount * product.quantity; // Calculate total amount (before discount)

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        images: [product.image], // Add product images for Stripe checkout
                    },
                    unit_amount: amount, // Price per item in cents
                },
                quantity: product.quantity || 1, // Default quantity is 1
            };
        });

        let coupon = null; // Initialize coupon variable

        // Check if user has entered a coupon code
        if (couponCode) {
            coupon = await Coupon.findOne({
                code: couponCode,
                userId: req.user._id,
                isActive: true // Ensure the coupon is active
            });

            // If a valid coupon is found, apply the discount to totalAmount
            //this will reduce the total-amount from the backend for keep track of payment
            if (coupon) {
                totalAmount -= Math.round(totalAmount * coupon.discountPercentage / 100);
            }

        }

        // Create a Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // Allow card payments
            line_items: lineItems, // Pass product details to Stripe
            mode: "payment", // One-time payment mode

            // Redirect URLs after successful or canceled payment
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,

            // Apply Stripe discount (if user entered a valid coupon)
            discounts: coupon
                ? [{
                    coupon: await createStripeCoupon(coupon.discountPercentage), // Create a Stripe coupon dynamically
                }]
                : [],

            // Metadata: Store extra info like user ID and coupon code
            metadata: {
                userId: req.user._id.toString(), // Store user ID
                couponCode: couponCode || "",   // Store coupon code (if provided)
                // Store product IDs, quantities, and prices in metadata & it supports the string only
                products: JSON.stringify(
                    products.map(p => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    }))
                )
            }
        });

        // **Gift Coupon Generation (Applies to Next Purchase)**
        // If totalAmount is greater than or equal to $200, generate a new coupon for future use
        if (totalAmount >= 20000) { // 20000 cents = $200
            await createNewCoupon(req.user._id);
        }

        // Send session data to client
        res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 }); // Convert cents to dollars

    } catch (error) {
        console.log("Error in createCheckoutSession:", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId); //this will retrieve the session from stripe
        if (session.payment_status === "paid") {
            if (session.metadata.couponCode) {
                // Update the coupon status to inactive coupon after successful payment
                await Coupon.findOneAndUpdate({ code: session.metadata.couponCode, userId: session.metadata.userId }, {
                    isActive: false
                })
            }
            //create a new order in database
            //convert back to obj to store in db
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map(product => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price
                })),
                totalAmount: session.amount_total / 100,//convert to cents
                stripeSessionId: sessionId
            })
            await newOrder.save();
            res.status(200).json({
                success: true,
                message: "Payment SuccessFul,order Created and Coupon deactivated if used."
            })

        }
    } catch (error) {
        console.log("Error in checkoutSuccess:", error.message);
        res.status(500).json({ message: error.message });
    }
}

// **Helper Function: Create a Stripe Coupon (Applies to First Purchase if Entered)**
async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage, // Percentage discount
        duration: "once", // Discount applies only once
    });
    return coupon.id; // Return the Stripe coupon ID
}

// **Helper Function: Create a New Coupon for Next Purchase**
async function createNewCoupon(userId) {
    // Generate a new coupon object in the database
    // After the First Purchase > $200, user will receive the coupon that stored in database and later can be used for next purchase

    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(), // Generate random coupon code
        discountPercentage: 10, // 10% discount for future use
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
        userId: userId, // Assign the coupon to the user
    });

    await newCoupon.save(); // Save the coupon to the database
    return newCoupon; // Return the new coupon object
}