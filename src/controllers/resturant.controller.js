const Resturant = require("../models/resturant.model");
const Item = require("../models/items.model");
const Order = require("../models/order.model");
const Review = require("../models/review.Model");
const mongoose = require("mongoose");

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

    // 2. Best Reviews (Highest Rated Orders)
    const bestReviews = await Review.aggregate([
      {
        $match: { restaurantId: restaurantId }, // only for this restaurant
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          userName: "$userDetails.name",
          userAvatar: "$userDetails.avatar",
        },
      },
      { $sort: { rating: -1, createdAt: -1 } }, // highest rating first, then newest
      { $limit: 10 },
    ]);

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

module.exports = {
  registerResturant,
  loginResturant,
  getResturantProfile,
  getResturantById,
  getAllResturants,
  upadateResturantData,
  updateResturantStatus,
  getResturantAnalytics,
};
