const express = require("express");
const User = require("../models/user.model");

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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({
        success: true,
        response: {
          message: "User logged in successfully!",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
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

module.exports = { registerUser, loginUser, getUser };
