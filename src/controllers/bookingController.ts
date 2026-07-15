import { Response } from "express";
import Booking from "../models/Booking";
import Tour from "../models/Tour";
import { AuthRequest } from "../middleware/authMiddleware";

// @desc    Create a booking (reserve a spot — no payment)
// @route   POST /api/bookings
export const createBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { tourId, guests } = req.body;

    if (!tourId || !guests) {
      res
        .status(400)
        .json({
          success: false,
          message: "Please provide tour and number of guests",
        });
      return;
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      res.status(404).json({ success: false, message: "Tour not found" });
      return;
    }

    if (guests > tour.maxGuests) {
      res.status(400).json({
        success: false,
        message: `Only ${tour.maxGuests} guests allowed for this tour`,
      });
      return;
    }

    const totalPrice = tour.price * Number(guests);

    const booking = await Booking.create({
      tour: tourId,
      user: req.user._id,
      guests,
      totalPrice,
      status: "confirmed",
    });

    const populatedBooking = await booking.populate(
      "tour",
      "title images location departureDate price",
    );

    res.status(201).json({ success: true, booking: populatedBooking });
  } catch (error) {
    console.error("Create booking error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating booking" });
  }
};

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/my
export const getMyBookings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const bookings = await Booking.find({ user: req.user._id })
      .populate("tour", "title images location departureDate price")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching bookings" });
  }
};

// @desc    Cancel a booking
// @route   DELETE /api/bookings/:id
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to cancel this booking",
        });
      return;
    }

    booking.status = "cancelled";
    await booking.save();

    res
      .status(200)
      .json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error cancelling booking" });
  }
};

// @desc    Get all bookings for a specific tour (organizer/admin only)
// @route   GET /api/bookings/tour/:tourId
export const getTourBookings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      res.status(404).json({ success: false, message: "Tour not found" });
      return;
    }

    const isOwner = tour.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to view these bookings",
        });
      return;
    }

    const bookings = await Booking.find({ tour: req.params.tourId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching tour bookings" });
  }
};
