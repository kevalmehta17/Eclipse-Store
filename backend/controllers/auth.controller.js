import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

//this function generates access and refresh tokens for the user authentication.
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};
// used to store the refresh token in Redis.
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`, //It ensures each user gets a unique key.
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

// used to set the access and refresh tokens in the cookies in browser.
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 60 * 1000, //15 minutes
    httpOnly: true, //prevents XSS attacks Cross-Site Scripting attacks
    sameSite: "strict", //CSRF attacks Cross-Site Request Forgery attacks
    secure: process.env.NODE_ENV === "production",
  });
  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    httpOnly: true, //prevents XSS attacks Cross-Site Scripting attacks
    sameSite: "strict", //CSRF attacks Cross-Site Request Forgery attacks
    secure: process.env.NODE_ENV === "production",
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    //email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email Format" }); // 400 Bad Request
    }
    const userAlreadyExist = await User.findOne({ email });
    if (userAlreadyExist) {
      return res
        .status(400)
        .json({ success: false, message: "User Already Exist" }); // 400 Bad Request
    }
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken); //store refresh token in Redis
    setCookies(res, accessToken, refreshToken); //set access and refresh tokens in cookies

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken); //store refresh token in Redis
      setCookies(res, accessToken, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    } // 401 Unauthorized

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    //check if the stored token in Redis is the same as the token in the cookie
    if (refreshToken !== storedToken) {
      res.status(401).json({ success: false, message: "Unauthenticated" });
    }
    //After the token is verified, generate a new access token for the user and send it in the response.
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ success: true, message: "Token refreshed SuccessFully" });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
