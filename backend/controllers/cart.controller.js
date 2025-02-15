import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
    try {
        const user = req.user; //get the current user from the token
        const products = await Product.find({ _id: { $in: user.cartItems } });
        const cartItems = products.map((product) => {
            const item = user.cartItems.find((item) => item.id === product.id);
            return { ...product.JSON(), quantity: item.quantity };
        })
        res.json(cartItems);
    } catch (error) {
        console.log("Error in getCartProducts controller", error.message);
        res.status(500).json({ message: error.message });
    }
}

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user; //get the current user from the token

        const existingProduct = user.cartItems.find(item => item.id === productId);
        if (existingProduct) {
            //if the product already exists in the cart, increase the quantity
            existingProduct.quantity += 1;
        }
        else {
            //add the product to the cartItems array for the first time
            user.cartItems.push({ product: productId });
        }
        await user.save();
        res.json(user.cartItems);

    } catch (error) {
        console.log("Error in addToCart controller", error.message);
        res.status(500).json({ message: error.message });
    }
}

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (!productId) {
            user.cartItems = [];
        }
        else {
            //remove the product from the cartItems array
            user.cartItems = user.cartItems.filter(item => item.id !== productId);
        }
        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in removeAllFromCart controller", error.message);
        res.status(500).json({ message: error.message });
    }
}

export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user //get the current user from the token

        const existingItem = user.cartItems.find(item => item.id === productId);
        if (existingItem) {
            if (quantity === 0) {
                //if the quantity is 0, remove the product from the cart
                user.cartItems = user.cartItems.filter(item => item.id !== productId);
                await user.save();
                return res.json(user.cartItems);
            }
            existingItem.quantity = quantity;
            await user.save();
            return res.status(200).json(user.cartItems);
        } else {
            return res.status(404).json({ message: "Product not found in cart" });
        }
    } catch (error) {
        console.log("Error in updateQuantity controller", error.message);
        res.status(500).json({ message: error.message });
    }
}