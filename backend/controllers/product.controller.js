import { redis } from "../lib/redis.js";
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

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts))
    }
    //if not from redis then fetched from the mongoDB
    //.lean() is used to get the plain JS object instead of mongoose object
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.status(404).json({ message: "Featured products not found" });
    }
    //store in redis for quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in product controller", error.message);
    res.status(500).json({ message: error.message });
  }
  //get the featuredData as object from redis and set as string
}