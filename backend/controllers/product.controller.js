import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); //this will get all products
    res.status(200).json(products);
  } catch (error) {
    console.log(`Error: ${error}`);
    res.status(500).json({ message: error.message });
  }
};
