const express = require("express");
const {
  placeOrder,
  getOrders,
  deleteOrder,
  removeOrderItem,
  viewAOrders,
  addItemToOrder,
  updateStatus,
} = require("../controllers/order.controller");
const checkAuth = require("../middleswares/auth.middleware");
const checkRole = require("../middleswares/checkRole.middleware");

const router = express.Router();

router.post("/place", checkAuth, checkRole(["customer"]), placeOrder);
router.get("/", checkAuth, getOrders);
router.put("/status/:id", checkAuth, updateStatus);
router.get("/:id", checkAuth, viewAOrders);
router.delete("/delete/:id", checkAuth, deleteOrder);
router.post("/remove/:id/:itemId", checkAuth, removeOrderItem);

module.exports = router;
