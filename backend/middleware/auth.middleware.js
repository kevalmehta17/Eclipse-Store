import jwt from jsonWebToken;
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookie.accessToken;
    if (!accessToken) {
      res.status(401).json({ message: "You are not authorized" }); //401 is unauthorized
    }
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    //this will give us the user id & not the password
    const user = await User.findById(decoded.userId).select("-password"); 

    if(!user){
      res.status(404).json({ message: "User not found" });
    }
    //this will give us the user object in the request
    req.user = user; 
    next(); //calling the next middleware
    
    } catch (error) {
      if(error.name === "TokenExpiredError"){
        return res.status(401).json({message:"unauthorized - Invalid access token"});
      }
      throw error;
    }
  } catch (error) {
    console.log("Error in Protect Route Middleware", error.message);
    return res.status(401).json({message:"unauthorized - Invalid access token"});
  }
};
  