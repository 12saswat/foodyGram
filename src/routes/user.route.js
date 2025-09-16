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
  getOrderStatus,
} = require("../controllers/user.controller");
const checkAuth = require("../middleswares/auth.middleware");
const checkRole = require("../middleswares/checkRole.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", checkAuth, checkRole(["customer"]), getUser);
router.get("/dashboard", checkAuth, checkRole(["customer"]), userDashboard);
router.get("/savedItems", checkAuth, checkRole(["customer"]), getSavedItems);
router.post("/save/:id", checkAuth, checkRole(["customer"]), savedItem);
router.get("/cartItems", checkAuth, checkRole(["customer"]), getCartItems);
router.post("/cart/:id", checkAuth, checkRole(["customer"]), addToCart);
router.post(
  "/cart/delete/:id",
  checkAuth,
  checkRole(["customer"]),
  deleteFromCart
);
router.post(
  "/saved/delete/:id",
  checkAuth,
  checkRole(["customer"]),
  deleteFromSaved
);
router.post("/checkout", checkAuth, checkRole(["customer"]), checkoutCart);
router.post(
  "/updateCart/:id",
  checkRole(["customer"]),
  checkAuth,
  updateCartQuantity
);
router.get(
  "/orderStatus/:id",
  checkAuth,
  checkRole(["customer"]),
  getOrderStatus
);
router.post(
  "/checkout/saved/:id",
  checkAuth,
  checkRole(["customer"]),
  orderSavedItem
);
module.exports = router;
