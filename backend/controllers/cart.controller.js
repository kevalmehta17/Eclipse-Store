export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user; //get the current user from the token

        const existingProduct = user.cartItems.find(item => item.id === productId);
        if (existingProduct) {
            existingProduct.quantity += 1;
        }
        else {
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