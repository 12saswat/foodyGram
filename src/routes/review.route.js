const express = require("express");
const {
  addReview,
  viewResturantReviews,
  getReviewById,
  deleteReview,
} = require("../controllers/review.controller");
const checkAuth = require("../middleswares/auth.middleware");

const router = express.Router();

router.post("/add", checkAuth, addReview);
router.get("/resturant/:id", checkAuth, viewResturantReviews);
router.get("/:id", checkAuth, getReviewById);
router.delete("/delete/:id", checkAuth, deleteReview);

module.exports = router;
