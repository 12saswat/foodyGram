const express = require("express");
const {
  getAllItems,
  create,
  updateItem,
  deleteItem,
  getItemById,
} = require("../controllers/items.controller");
const upload = require("../utils/uploade");
const checkAuth = require("../middleswares/auth.middleware");
const checkRole = require("../middleswares/checkRole.middleware");

const router = express.Router();

router.get("/", checkAuth, getAllItems);
router.get("/item/:id", checkAuth, getItemById);
router.post(
  "/create",
  checkAuth,
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "imageUrl", maxCount: 1 },
  ]),
  checkRole(["restaurant"]),
  create
);

router.put(
  "/update/:id",
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "imageUrl", maxCount: 1 },
  ]),
  checkAuth,
  checkRole(["restaurant"]),
  updateItem
);
router.delete("/delete/:id", checkAuth, checkRole(["restaurant"]), deleteItem);

module.exports = router;
