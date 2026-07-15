import { Response } from "express";
import Review from "../models/Review";
import Tour from "../models/Tour";
import { AuthRequest } from "../middleware/authMiddleware";

// Recalculate and update a tour's average rating
const updateTourRating = async (tourId: string): Promise<void> => {
  const reviews = await Review.find({ tour: tourId });
  const numReviews = reviews.length;
  const avgRating =
    numReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews
      : 0;

  await Tour.findByIdAndUpdate(tourId, {
    avgRating: Math.round(avgRating * 10) / 10,
    numReviews,
  });
};

// @desc    Get all reviews for a tour (public)
// @route   GET /api/reviews/tour/:tourId
export const getTourReviews = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reviews = await Review.find({ tour: req.params.tourId })
      .populate("user", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching reviews" });
  }
};

// @desc    Create a review (protected)
// @route   POST /api/reviews
export const createReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { tourId, rating, comment } = req.body;

    if (!tourId || !rating || !comment) {
      res
        .status(400)
        .json({
          success: false,
          message: "Please provide tour, rating, and comment",
        });
      return;
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      res.status(404).json({ success: false, message: "Tour not found" });
      return;
    }

    const existingReview = await Review.findOne({
      tour: tourId,
      user: req.user._id,
    });
    if (existingReview) {
      res
        .status(400)
        .json({ success: false, message: "You already reviewed this tour" });
      return;
    }

    const review = await Review.create({
      tour: tourId,
      user: req.user._id,
      rating,
      comment,
    });

    await updateTourRating(tourId);

    const populatedReview = await review.populate("user", "name image");

    res.status(201).json({ success: true, review: populatedReview });
  } catch (error) {
    console.error("Create review error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating review" });
  }
};

// @desc    Delete a review (owner or admin only)
// @route   DELETE /api/reviews/:id
export const deleteReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this review",
        });
      return;
    }

    const tourId = review.tour.toString();
    await review.deleteOne();
    await updateTourRating(tourId);

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error deleting review" });
  }
};
