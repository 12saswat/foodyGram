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

const router = express.Router();

router.get("/", checkAuth, getAllItems);
router.get("/item/:id", checkAuth, getItemById);
router.post(
  "/create",
  upload.fields([
    { name: "videoUrl", checkAuth, maxCount: 1 },
    { name: "imageUrl", checkAuth, maxCount: 1 },
  ]),
  create
);

router.put(
  "/update/:id",
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "imageUrl", maxCount: 1 },
  ]),
  checkAuth,
  updateItem
);
router.delete("/delete/:id", checkAuth, deleteItem);

module.exports = router;
