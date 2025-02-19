import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
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
      return res.json(JSON.parse(featuredProducts)) //convert string to object coming from redis
    }
    //if not from redis then fetched from the mongoDB
    //.lean() is used to get the plain JS object instead of mongoose object
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.status(404).json({ message: "Featured products not found" });
    }
    //store in redis for quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts)); //convert object to string to store in redis
    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in product controller", error.message);
    res.status(500).json({ message: error.message });
  }
  //get the featuredData as object from redis and set as string
}

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "Products" });
    }
    const product = new Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
      category,
    })
    res.status(201).json(product);
  } catch (error) {
    console.log("Error while creating product", error.message);
    res.status(500).json({ message: error.message });
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0]; //get the public id of the image ex:-sample-Image
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image deleted from cloudinary");
      } catch (error) {
        console.log("Error while deleting image from cloudinary", error.message);
        res.status(500).json({ message: error.message });
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product removed" });

  } catch (error) {
    console.log("Error in delete controller", error.message);
    res.status(500).json({ message: error.message });
  }
}

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 } //get 3 random products
      }, {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1
        }
      }
    ])
    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: error.message });
  }
}

export const getProductByCategory = async (req, res) => {
  const { category } = req.params; //get the category from the params of the request
  try {
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    console.log("Error in getProductByCategory controller", error.message);
    res.status(500).json({ message: error.message });
  }
}

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    }
    product.isFeatured = !product.isFeatured; //this will true/false the featured Product
    const updatedProduct = await product.save(); //save the updated product in mongoDB
    await updateFeaturedProductsCache(); //update the featured products in redis
    res.json(updatedProduct);

  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: error.message });
  }
}

async function updateFeaturedProductsCache() {
  try {
    //get the featured products from the mongoDB
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    //And then updated featured Product store the in redis
    await redis.set("featured_products", JSON.stringify())
  } catch (error) {
    console.log("Error in updatedFeaturedProductsCache", error.message);
  }
}