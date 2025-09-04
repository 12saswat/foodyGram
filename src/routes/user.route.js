const express = require("express");
const {
  registerUser,
  loginUser,
  getUser,
} = require("../controllers/user.controller");
const checkAuth = require("../middleswares/auth.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", checkAuth, getUser);


module.exports = router;
