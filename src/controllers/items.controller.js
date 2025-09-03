const Resturant = require("../models/resturant.model");
const Item = require("../models/items.model");

const create = async (req, res) => {
  try {
    const { name, description, price, category, resturantId } = req.body;
    const imageUrl = req.files?.imageUrl ? req.files.imageUrl[0].path : null;
    const videoUrl = req.files?.videoUrl ? req.files.videoUrl[0].path : null;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !resturantId ||
      !videoUrl
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message: "All fields are required",
        },
      });
    }

    const newItem = new Item({
      name,
      description,
      price,
      category,
      videoUrl,
      imageUrl,
      resturant: resturantId,
    });

    const savedItem = await newItem.save();

    // Add the item to the restaurant's items array
    await Resturant.findByIdAndUpdate(resturantId, {
      $push: { items: savedItem._id },
    });

    res.status(201).json({
      success: true,
      data: savedItem,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const getItemById = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Item not found",
        },
      });
    }
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const updates = req.body;

    const updatedItem = await Item.findByIdAndUpdate(itemId, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Item not found",
        },
      });
    }
    res.status(200).json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const deletedItem = await Item.findByIdAndDelete(itemId);
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Item not found",
        },
      });
    }
    // Remove the item from the restaurant's items array
    await Resturant.findByIdAndUpdate(deletedItem.resturant, {
      $pull: { items: deletedItem._id },
    });
    res.status(200).json({
      success: true,
      data: deletedItem,
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal Server error",
      },
    });
  }
};

module.exports = {
  create,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
