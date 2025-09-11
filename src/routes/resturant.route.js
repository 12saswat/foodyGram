const express = require("express");
const {
  registerResturant,
  loginResturant,
  getResturantProfile,
  getAllResturants,
  updateResturantStatus,
  upadateResturantData,
  getResturantById,
} = require("../controllers/resturant.controller");
const checkAuth = require("../middleswares/auth.middleware");
const router = express.Router();

router.post("/register", registerResturant);
router.post("/login", loginResturant);
router.get("/profile", checkAuth, getResturantProfile);
router.get("/:id", checkAuth, getResturantById);
router.get("/", checkAuth, getAllResturants);
router.put("/update", checkAuth, upadateResturantData);
router.patch("/status", checkAuth, updateResturantStatus);

module.exports = router;
