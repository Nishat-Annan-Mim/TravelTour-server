import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getTourBookings,
} from "../controllers/bookingController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/tour/:tourId", protect, getTourBookings);
router.delete("/:id", protect, cancelBooking);

export default router;
