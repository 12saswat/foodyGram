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
const checkRole = require("../middleswares/checkRole.middleware");

const router = express.Router();

router.post("/register", registerResturant);
router.post("/login", loginResturant);
router.get(
  "/profile",
  checkAuth,
  checkRole(["restaurant"]),
  getResturantProfile
);

router.get("/", checkAuth, checkRole(["restaurant"]), getAllResturants);
router.put(
  "/update",
  checkAuth,
  checkRole(["restaurant"]),
  upadateResturantData
);
router.patch(
  "/status",
  checkAuth,
  checkRole(["restaurant"]),
  updateResturantStatus
);
router.get("/:id", checkAuth, checkRole(["restaurant"]), getResturantById);

module.exports = router;
