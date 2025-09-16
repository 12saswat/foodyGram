const Order = require("../models/order.model");
const Items = require("../models/items.model");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Resturant = require("../models/resturant.model");

const placeOrder = async (req, res) => {
  try {
    const { items, address, paymentStatus } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    if (!items || items.length === 0 || !address) {
      return res.status(400).json({
        success: false,
        message: "Items and address are required",
      });
    }

    // Fetch item details from DB
    let totalAmount = 0;
    const orderItems = [];
    const restaurantIds = new Set();

    for (const i of items) {
      const dbItem = await Items.findById(i.item);

      if (!dbItem) {
        return res.status(404).json({
          success: false,
          message: `Item not found: ${i.item}`,
        });
      }

      const quantity = i.quantity || 1;
      const price = dbItem.price;

      totalAmount += price * quantity;

      // Extract restaurant ID from item's resturantId field
      restaurantIds.add(dbItem.resturantId.toString());

      orderItems.push({
        item: dbItem._id,
        quantity,
        price,
      });
    }

    const uniqueRestaurants = Array.from(restaurantIds);
    console.log(uniqueRestaurants);
    const newOrder = new Order({
      user: userId,
      restaurant: uniqueRestaurants,
      items: orderItems,
      totalAmount,
      address,
      paymentStatus: paymentStatus || "pending",
    });

    await newOrder.save();

    // Update user's orders
    await User.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    // Update restaurants' orders
    await Resturant.updateMany(
      { _id: { $in: uniqueRestaurants } },
      { $push: { orders: newOrder._id } }
    );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // Populate restaurants array and each item's details
    const orders = await Order.find({ user: userId })
      .populate("restaurant", "name address phone avatar")
      .populate({
        path: "items.item",
        populate: {
          path: "resturantId",
          select: "name address phone avatar",
        },
      });

    const formattedOrders = orders.map((order) => {
      const totalAmount = order.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      return {
        ...order.toObject(),
        totalAmount,
        items: order.items.map((i) => ({
          ...i.item._doc,
          quantity: i.quantity,
          price: i.price,
          // Add restaurant info from the populated resturantId
          restaurant: i.item.resturantId
            ? {
                name: i.item.resturantId.name,
                address: i.item.resturantId.address,
                phone: i.item.resturantId.phone,
                avatar: i.item.resturantId.avatar,
              }
            : null,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const viewAOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, user: userId }).populate(
      "items.item"
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    // Delete the order that belongs to this user
    const deletedOrder = await Order.findOneAndDelete({
      _id: orderId,
      user: userId,
    });

    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const removeOrderItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;
    const itemId = req.params.itemId;

    if (!orderId || !itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID and Item ID are required" });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    await Order.updateOne(
      { _id: orderId, user: userId },
      { $pull: { items: { item: itemId } } }
    );

    order.totalAmount = order.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Item removed from order" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!orderId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID and status are required" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  placeOrder,
  getOrders,
  deleteOrder,
  removeOrderItem,
  viewAOrders,
  updateStatus,
};
