const express = require("express");
const {
  registerUser,
  loginUser,
  getUser,
  getSavedItems,
  savedItem,
  getCartItems,
  addToCart,
  deleteFromCart,
  deleteFromSaved,
  checkoutCart,
  updateCartQuantity,
  orderSavedItem,
  userDashboard,
} = require("../controllers/user.controller");
const checkAuth = require("../middleswares/auth.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", checkAuth, getUser);
router.get("/dashboard", checkAuth, userDashboard);
router.get("/savedItems", checkAuth, getSavedItems);
router.post("/save/:id", checkAuth, savedItem);
router.get("/cartItems", checkAuth, getCartItems);
router.post("/cart/:id", checkAuth, addToCart);
router.post("/cart/delete/:id", checkAuth, deleteFromCart);
router.post("/saved/delete/:id", checkAuth, deleteFromSaved);
router.post("/checkout", checkAuth, checkoutCart);
router.post("/updateCart/:id", checkAuth, updateCartQuantity);
router.post("/checkout/saved/:id", checkAuth, orderSavedItem);
module.exports = router;
