const Resturant = require("../models/resturant.model");
const Item = require("../models/items.model");
const Order = require("../models/order.model");
const Review = require("../models/review.Model");
const mongoose = require("mongoose");
const generateOtp = require("../utils/generateOtp");
const sendEmail = require("../utils/mailer");

const registerResturant = async (req, res) => {
  const { name, address, phone, email, type, password, rating } = req.body;
  try {
    if (!name || !address || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Name, address, and email are required",
        },
      });
    }
    const existingResturant = await Resturant.findOne({ email });
    if (existingResturant) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Resturant with this email already exists",
        },
      });
    }
    const newResturant = new Resturant({
      name,
      address,
      password,
      phone,
      email,
      type,
      rating,
    });
    await newResturant.save();
    res.status(201).json({
      success: true,
      message: "Resturant registered successfully",
    });
  } catch (error) {
    console.error("Error registering restaurant:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const loginResturant = async (req, res) => {
  const { email, password } = req.body;
  try {
    if ((!email, !password)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "All filed is required",
        },
      });
    }
    const resturant = await Resturant.findOne({ email });
    if (!resturant) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Resturant not found",
        },
      });
    }
    const isPasswordValid = await resturant.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid password",
        },
      });
    }
    const token = resturant.generateAccessToken();

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "production", // true in prod
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        token: token,
        message: "Resturant logged in successfully",
      });
  } catch (error) {
    console.error("Error logging in restaurant:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }
    const resturant = await Resturant.findById(userId);
    if (!resturant) {
      return res.status(404).json({ success: false, message: " not found" });
    }
    resturant.password = password;
    await resturant.save();

    const token = resturant.generateAccessToken();

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "production", // true in prod
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        token: token,
        response: {
          message: "Password reset successfully!",
        },
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const getResturantProfile = async (req, res) => {
  try {
    const resturantId = req.user._id;

    const resturant = await Resturant.findById(resturantId).populate("items"); // populate all items

    if (!resturant) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Restaurant not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: resturant,
    });
  } catch (error) {
    console.error("Error fetching restaurant profile:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const getResturantById = async (req, res) => {
  try {
    const resturantId = req.params.id;
    const resturant = await Resturant.findById(resturantId).populate("items"); // populate all items
    if (!resturant) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Restaurant not found",
        },
      });
    }
    res.status(200).json({
      success: true,
      data: resturant,
    });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const getAllResturants = async (req, res) => {
  try {
    const resturants = await Resturant.find();
    res.status(200).json({
      success: true,
      data: resturants,
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const upadateResturantData = async (req, res) => {
  try {
    const resturantId = req.user._id;
    const { name, address, phone, email, type } = req.body;
    const updateData = { name, address, phone, email, type };

    const resturant = await Resturant.findByIdAndUpdate(
      resturantId,
      updateData,
      { new: true }
    );
    if (!resturant) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Resturant not found",
        },
      });
    }
    res.status(200).json({
      success: true,
      data: resturant,
    });
  } catch (error) {
    console.error("Error updating restaurant data:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const updateResturantStatus = async (req, res) => {
  const resturantId = req.user._id;
  const { status } = req.body; // expected values: "open" or "close"
  try {
    if (!["open", "close"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid status value",
        },
      });
    }
    const resturant = await Resturant.findById(resturantId);
    if (!resturant) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Resturant not found",
        },
      });
    }
    resturant.status = status;
    await resturant.save();
    res.status(200).json({
      success: true,
      message: `Resturant is now ${status}`,
    });
  } catch (error) {
    console.error("Error updating restaurant status:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const getResturantAnalytics = async (req, res) => {
  try {
    const restaurantId = req.user._id;

    // 1. Best Items with Ratings (Most Liked)
    const bestItems = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.item",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: "$itemDetails" },
      {
        $lookup: {
          from: "reviews",
          localField: "reviews", // match order.reviews array
          foreignField: "_id",
          as: "orderReviews",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$orderReviews" },
        },
      },
      {
        $group: {
          _id: "$items.item",
          itemName: { $first: "$itemDetails.name" },
          itemImage: { $first: "$itemDetails.imageUrl" },
          category: { $first: "$itemDetails.category" },
          price: { $first: "$itemDetails.price" },
          totalOrdered: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          avgRating: { $avg: "$orderReviews.rating" },
          reviewCount: { $sum: "$reviewCount" },
        },
      },
      { $sort: { totalOrdered: -1, avgRating: -1 } },
      { $limit: 10 },
    ]);

    // 2. Best Reviews
    const bestReviews = await Review.find({
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    })
      .populate("userId", "name avatar")
      .sort({ rating: -1, createdAt: -1 })
      .limit(10);

    // 3. Cancelled Orders Analysis
    const cancelledOrders = await Order.aggregate([
      {
        $match: {
          status: "cancelled",
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.item",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: "$itemDetails" },
      {
        $group: {
          _id: "$items.item",
          itemName: { $first: "$itemDetails.name" },
          category: { $first: "$itemDetails.category" },
          cancelledCount: { $sum: "$items.quantity" },
          lostRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { cancelledCount: -1 } },
      { $limit: 10 },
    ]);

    // 4. Disliked Items (Low Ratings)
    const dislikedItems = await Review.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      { $unwind: "$orderDetails" },
      {
        $match: {
          "orderDetails.restaurant": restaurantId,
          rating: { $lte: 2 },
        },
      },

      { $unwind: "$orderDetails.items" },
      {
        $lookup: {
          from: "items",
          localField: "orderDetails.items.item",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: "$itemDetails" },
      {
        $group: {
          _id: "$orderDetails.items.item",
          itemName: { $first: "$itemDetails.name" },
          category: { $first: "$itemDetails.category" },
          avgRating: { $avg: "$rating" },
          negativeReviews: { $sum: 1 },
          comments: { $push: "$comment" },
        },
      },
      { $sort: { avgRating: 1, negativeReviews: -1 } },
      { $limit: 10 },
    ]);

    // 5. Monthly Overview Stats
    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    // 6. Category Performance
    const categoryPerformance = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.item",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: "$itemDetails" },
      {
        $group: {
          _id: "$itemDetails.category",
          totalOrdered: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          uniqueItems: { $addToSet: "$items.item" },
        },
      },
      {
        $project: {
          category: "$_id",
          totalOrdered: 1,
          totalRevenue: 1,
          uniqueItemsCount: { $size: "$uniqueItems" },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // 7. Daily Performance (for the selected month)
    const dailyPerformance = await Order.aggregate([
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        bestItems,
        bestReviews,
        cancelledOrders,
        dislikedItems,
        monthlyStats: monthlyStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          pendingOrders: 0,
        },
        categoryPerformance,
        dailyPerformance,
      },
    });
  } catch (error) {
    console.error("Error fetching restaurant analytics:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal Server error" },
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const resturantId = req.user._id;

    if (!resturantId) {
      return res.status(400).json({
        success: false,
        error: { message: "Restaurant not found" },
      });
    }

    const restaurant = await Resturant.findById(resturantId);

    if (!restaurant || !restaurant.orders || restaurant.orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "No orders found for this restaurant" },
      });
    }

    const orders = await Order.find({
      _id: { $in: restaurant.orders },
    })
      .populate("user", "name email phone")
      .populate("items.item", "name price category imageUrl ")
      .select("-restaurant")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal Server Error" },
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const resturant = await Resturant.findOne({ email });
    if (!resturant) {
      return res.status(404).json({
        success: false,
        message: " not found",
      });
    }

    // generate 6 digit otp
    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000;

    resturant.otp = otp;
    // set expiry time to 10 minutes from now
    resturant.otpExpiry = expiry;
    await resturant.save();

    // Create a link for password reset
    // Ensure CLIENT_URL is defined in your environment variables
    const linkUrl = `${process.env.CLIENT_URL}/worker/auth/reset-password/${resturant._id}`;

    // Email content
    // Use a template literal to create the HTML content
    // HTML email content
    const html = `
      <p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>
      <p>You can also reset your password directly using the link below:</p>
      <a href="${linkUrl}" style="display:inline-block;padding:10px 20px;background-color:#007BFF;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
    `;

    // Send the email using the sendEmail utility
    await sendEmail({ to: email, subject: "Password Reset OTP", html });
    res.status(200).json({
      success: true,
      response: {
        message: "OTP sent successfully",
      },
      data: {
        workerId: resturant._id,
        RedirectUrl: linkUrl,
      },
    });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server Error",
      },
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        error: {
          message: "OTP is required",
        },
      });
    }

    const userId = req.params.id;
    const resturant = await Resturant.findById(userId);

    if (!resturant || !resturant.otp || !resturant.otpExpiry) {
      return res.status(400).json({
        success: false,
        error: {
          message: "OTP not found or expired",
        },
      });
    }

    if (resturant.otp !== otp || resturant.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid or expired OTP",
        },
      });
    }
    // Clear OTP fields after successful verification
    resturant.otp = null;
    resturant.otpExpiry = null;

    res.status(200).json({
      success: true,
      response: {
        message: "OTP verified successfully",
      },
      data: null,
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server Error",
      },
    });
  }
};

module.exports = {
  registerResturant,
  loginResturant,
  getResturantProfile,
  getResturantById,
  getAllResturants,
  upadateResturantData,
  updateResturantStatus,
  getResturantAnalytics,
  getOrders,
  resetPassword,
  verifyOtp,
  sendOtp,
};
