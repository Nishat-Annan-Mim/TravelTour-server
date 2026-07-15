import express from "express";
import {
  getTours,
  getTourById,
  getRelatedTours,
  createTour,
  updateTour,
  deleteTour,
  getMyTours,
} from "../controllers/tourController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.get("/", getTours);

// Protected routes (must come before /:id to avoid route collision)
router.get("/my/listings", protect, getMyTours);
router.post("/", protect, createTour);

// Public routes with param
router.get("/:id", getTourById);
router.get("/:id/related", getRelatedTours);

// Protected routes with param
router.put("/:id", protect, updateTour);
router.delete("/:id", protect, deleteTour);

export default router;
