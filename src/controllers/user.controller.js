const express = require("express");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const Item = require("../models/items.model");
const Resturant = require("../models/resturant.model");
const Order = require("../models/order.model");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        response: {
          message: "User already exists!",
        },
      });
    }
    const newUser = new User({ name, email, password, role });
    newUser.save();
    const token = newUser.generateAccessToken();

    return res
      .status(201)
      .cookie("token", token)
      .json({
        success: true,
        response: {
          message: "User register successfully!",
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

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = user.generateAccessToken();

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
        token: token, // Add this line
        response: {
          message: "User logged in successfully!",
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

const getUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, response: { user } });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const savedItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;

    if (!userId || !itemId) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item id" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.savedItems.push(itemId);
    await user.save();
    return res
      .status(200)
      .json({ success: true, response: { message: "saved" } });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getSavedItems = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }
    const user = await User.findById(userId).populate("savedItems");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, response: user.savedItems });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // check if item already in cart
    const existingItem = user.cartItems.find(
      (ci) =>
        ci.item &&
        (ci.item.toString?.() === itemId || ci.item._id?.toString() === itemId)
    );

    if (existingItem) {
      existingItem.quantity += 1; // increment quantity
    } else {
      user.cartItems.push({ item: itemId, quantity: 1 });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      response: { message: "Item added to cart" },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getCartItems = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("cartItems.item");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // filter out invalid entries
    const items = user.cartItems
      .filter((ci) => ci.item) // only keep ones with a valid item
      .map((ci) => ({
        _id: ci.item._id,
        name: ci.item.name,
        description: ci.item.description,
        price: ci.item.price,
        category: ci.item.category,
        imageUrl: ci.item.imageUrl,
        videoUrl: ci.item.videoUrl,
        resturantId: ci.item.resturantId,
        createdAt: ci.item.createdAt,
        updatedAt: ci.item.updatedAt,
        __v: ci.item.__v,
        quantity: ci.quantity,
      }));

    const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);
    const totalAmount = items.reduce(
      (sum, ci) => sum + ci.price * ci.quantity,
      0
    );

    return res.status(200).json({
      success: true,
      response: { items, totalItems, totalAmount },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const deleteFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;

    if (!userId || !itemId) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Remove cart item where "item" matches itemId
    user.cartItems = user.cartItems.filter(
      (cartItem) => cartItem.item.toString() !== itemId
    );

    await user.save();

    return res.status(200).json({
      success: true,
      response: { message: "Item removed from cart" },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const deleteFromSaved = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;
    if (!userId || !itemId) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item id" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.savedItems.pull(itemId);
    await user.save();
    return res.status(200).json({
      success: true,
      response: { message: "Item removed from saved" },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const checkoutCart = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    const user = await User.findById(userId).populate("cartItems.item");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // filter only valid items
    const validCartItems = user.cartItems.filter((ci) => ci.item);

    if (validCartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid items in cart" });
    }

    const order = new Order({
      user: userId,
      items: validCartItems.map((ci) => ({
        item: ci.item._id,
        price: ci.item.price,
        quantity: ci.quantity || 1,
      })),
      total: validCartItems.reduce(
        (sum, ci) => sum + ci.item.price * (ci.quantity || 1),
        0
      ),
      status: "pending",
      paymentStatus: "pending",
    });

    await order.save();

    // clear cart after checkout
    user.cartItems = [];
    await user.save();

    return res.status(200).json({
      success: true,
      response: { message: "Checkout successful, cart is now empty" },
      orderId: order._id,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Update cart quantity
const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid item id" });
    }

    if (quantity < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity cannot be negative" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cartItem = user.cartItems.find(
      (ci) =>
        ci.item.toString() === itemId || ci.item._id?.toString() === itemId
    );

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    if (quantity === 0) {
      // remove item if quantity is 0
      user.cartItems = user.cartItems.filter(
        (ci) => ci.item.toString() !== itemId
      );
    } else {
      cartItem.quantity = quantity; // set new quantity
    }

    await user.save();

    return res.status(200).json({
      success: true,
      response: { message: "Cart updated", cart: user.cartItems },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const orderSavedItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user or item id" });
    }

    const user = await User.findById(userId).populate("savedItems");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Find the item in savedItems
    const item = user.savedItems.find((i) => i._id.toString() === itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in saved items" });
    }

    // Create order for this item
    const order = new Order({
      user: userId,
      items: [
        {
          item: item._id,
          price: item.price,
          quantity: 1,
        },
      ],
      totalAmount: item.price,
      status: "pending",
      paymentStatus: "pending",
    });

    await order.save();

    // Optionally, remove the item from savedItems after ordering
    user.savedItems.pull(itemId);
    await user.save();

    return res.status(200).json({
      success: true,
      response: { message: "Order placed for saved item", orderId: order._id },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const userDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. User Profile
    const user = await User.findById(userId)
      .select("-password")
      .populate("savedItems")
      .populate("cartItems.item");

    // 2. Recent Orders
    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("restaurant", "name")
      .populate("items.item", "name price");

    // 3. Popular Hotels
    const popularHotels = await Resturant.find()
      .sort({ rating: -1 })
      .limit(5)
      .select("name address rating type avatar");

    // 4. Food Analytics (items grouped by category)
    const foodAnalytics = await Item.aggregate([
      {
        $group: {
          _id: "$category",
          totalItems: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { totalItems: -1 } },
    ]);

    // 5. User Stats
    const totalOrders = await Order.countDocuments({ user: userId });

    const totalSpentAgg = await Order.aggregate([
      { $match: { user: userId, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalSpent = totalSpentAgg[0]?.total || 0;

    const savedItemsCount = user.savedItems.length;
    const cartItemsCount = user.cartItems.length;

    // Send response
    return res.json({
      success: true,
      data: {
        user,
        stats: {
          totalOrders,
          totalSpent,
          savedItemsCount,
          cartItemsCount,
        },
        recentOrders,
        popularHotels,
        foodAnalytics,
      },
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  savedItem,
  getSavedItems,
  getCartItems,
  addToCart,
  deleteFromCart,
  deleteFromSaved,
  updateCartQuantity,
  checkoutCart,
  orderSavedItem,
  userDashboard,
};
