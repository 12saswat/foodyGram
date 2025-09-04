const express = require("express");
const {
  getAllItems,
  create,
  updateItem,
  deleteItem,
  getItemById,
} = require("../controllers/items.controller");
const upload = require("../utils/uploade");

const router = express.Router();

router.get("/", getAllItems);
router.get("/item/:id", getItemById);
router.post(
  "/create",
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "imageUrl", maxCount: 1 },
  ]),
  create
);

router.put(
  "/update/:id",
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "imageUrl", maxCount: 1 },
  ]),
  updateItem
);
router.delete("/delete/:id", deleteItem);

module.exports = router;
