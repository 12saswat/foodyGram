const express = require("express");
const {
  getAllItems,
  create,
  updateItem,
  deleteItem,
  getItemById,
} = require("../controllers/items.controller");
const { upload } = require("../middleswares/uplode");

const router = express.Router();

router.get("/", getAllItems);
router.post("/create", upload.array("videoUrl"), create);
router.post("/item", getItemById);
router.put("/update/:id", updateItem);
router.delete("/delete/:id", deleteItem);

module.exports = router;
