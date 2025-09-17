const express = require("express");
const {
  registerResturant,
  loginResturant,
  getResturantProfile,
  getAllResturants,
  updateResturantStatus,
  upadateResturantData,
  getResturantById,
  getResturantAnalytics,
  getOrders,
  resetPassword,
  sendOtp,
  verifyOtp,
} = require("../controllers/resturant.controller");
const checkAuth = require("../middleswares/auth.middleware");
const checkRole = require("../middleswares/checkRole.middleware");

const router = express.Router();

router.post("/register", registerResturant);
router.post("/login", loginResturant);
router.post("/resetPassword/:id", resetPassword);
router.post("/sendOtp", sendOtp);
router.post("/verifyOtp/:id", verifyOtp);
router.get("/profile", checkAuth, getResturantProfile);

router.get("/", checkAuth, checkRole(["restaurant"]), getAllResturants);
router.put(
  "/update",
  checkAuth,
  checkRole(["restaurant"]),
  upadateResturantData
);

router.get("/analytics", checkAuth, getResturantAnalytics);

router.patch(
  "/status",
  checkAuth,
  checkRole(["restaurant"]),
  updateResturantStatus
);
router.get("/orders", checkAuth, checkRole(["restaurant"]), getOrders);

router.get("/:id", checkAuth, getResturantById);

module.exports = router;
