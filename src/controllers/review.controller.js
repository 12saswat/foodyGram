const Order = require("../models/order.model");
const Resturant = require("../models/resturant.model");
const Review = require("../models/review.Model");

const addReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const userId = req.user._id; // from checkAuth

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ✅ Prevent duplicate reviews for same order
    const existing = await Review.findOne({ orderId, userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this order",
      });
    }

    const review = new Review({
      orderId,
      userId,
      restaurantId: order.restaurant,
      rating,
      comment,
    });

    await review.save();
    await Order.findByIdAndUpdate(orderId, {
      $push: { reviews: review._id },
    });

    await Resturant.findByIdAndUpdate(order.restaurant, {
      $push: { reviews: review._id },
      $inc: { rating: rating },
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

viewResturantReviews = async (req, res) => {
  try {
    const resturantId = req.params.id;
    const reviews = await Review.find({ resturantId });
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const getReviewById = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Review not found",
        },
      });
    }
    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Review not found",
        },
      });
    }
    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

module.exports = {
  addReview,
  viewResturantReviews,
  getReviewById,
  deleteReview,
};
