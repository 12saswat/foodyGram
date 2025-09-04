const Resturant = require("../models/resturant.model");
const Item = require("../models/items.model");
const uploadOnCloudinary = require("../utils/cloudinary");
const mongoose = require("mongoose");

const create = async (req, res) => {
  try {
    const { name, description, price, category, resturantId } = req.body;

    let videoUrl = null;
    let imageUrl = null;

    if (!mongoose.Types.ObjectId.isValid(resturantId)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid restaurant ID" },
      });
    }

    // ✅ Upload video
    if (req.files["videoUrl"]) {
      const videoPath = req.files["videoUrl"][0].path;
      const result = await uploadOnCloudinary(videoPath, "video");
      if (result?.secure_url) {
        videoUrl = result.secure_url;
      }
    }

    // ✅ Upload image
    if (req.files["imageUrl"]) {
      const imagePath = req.files["imageUrl"][0].path;
      const result = await uploadOnCloudinary(imagePath, "image");
      if (result?.secure_url) {
        imageUrl = result.secure_url;
      }
    }

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
        error: { message: "All fields are required" },
      });
    }

    const newItem = new Item({
      name,
      description,
      price,
      category,
      videoUrl,
      imageUrl,
      resturantId: resturantId,
    });

    const savedItem = await newItem.save();

    await Resturant.findByIdAndUpdate(resturantId, {
      $push: { items: savedItem._id },
    });

    res.status(201).json({
      success: true,
      response: {
        message: "Item created successfully",
      },
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal Server error" },
    });
  }
};

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().populate({
      path: "resturantId",
      select: "name address avatar rating",
    });
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

    const fileFields = ["videoUrl", "imageUrl"];
    for (const field of fileFields) {
      if (req.files && req.files[field]) {
        const filePath = req.files[field][0].path;
        const result = await uploadOnCloudinary(
          filePath,
          field === "videoUrl" ? "video" : "image"
        );
        if (result?.secure_url) {
          updates[field] = result.secure_url;
        }
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      updates,
      fileFields,
      {
        new: true,
        runValidators: true,
      }
    );
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
      response: "Item deleted successfully",
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
