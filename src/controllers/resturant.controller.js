const Resturant = require("../models/resturant.model");

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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.status(200).json({
      success: true,
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

    const resturant = await Resturant.findById(resturantId);
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
    console.error("Error fetching restaurant profile:", error);
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

module.exports = {
  registerResturant,
  loginResturant,
  getResturantProfile,
  getAllResturants,
  upadateResturantData,
  updateResturantStatus,
};
