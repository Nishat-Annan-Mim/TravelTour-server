import express from "express";
import {
  getTourReviews,
  createReview,
  deleteReview,
} from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/tour/:tourId", getTourReviews);
router.post("/", protect, createReview);
router.delete("/:id", protect, deleteReview);

export default router;
