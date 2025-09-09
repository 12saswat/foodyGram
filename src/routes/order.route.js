const express = require("express");
const {
  placeOrder,
  getOrders,
  deleteOrder,
  removeOrderItem,
  viewAOrders,
  addItemToOrder,
} = require("../controllers/order.controller");
const checkAuth = require("../middleswares/auth.middleware");

const router = express.Router();

router.post("/place", checkAuth, placeOrder);
router.get("/", checkAuth, getOrders);
router.get("/:id", checkAuth, viewAOrders);
router.delete("/delete/:id", checkAuth, deleteOrder);
router.post("/remove/:id/:itemId", checkAuth, removeOrderItem);

module.exports = router;
