import { Response } from "express";
import Tour from "../models/Tour";
import { AuthRequest } from "../middleware/authMiddleware";

// @desc    Get all tours (public) — search, filter, sort, paginate
// @route   GET /api/tours
export const getTours = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page = "1",
      limit = "8",
    } = req.query;

    const query: Record<string, any> = {};

    // Search by title or location
    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: "i" } },
        { location: { $regex: search as string, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by minimum rating
    if (minRating) {
      query.avgRating = { $gte: Number(minRating) };
    }

    // Sorting
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { avgRating: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "date":
        sortOption = { departureDate: 1 };
        break;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [tours, total] = await Promise.all([
      Tour.find(query)
        .populate("organizer", "name email image")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Tour.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: tours.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      tours,
    });
  } catch (error) {
    console.error("Get tours error:", error);
    res.status(500).json({ success: false, message: "Server error fetching tours" });
  }
};

// @desc    Get single tour by ID (public)
// @route   GET /api/tours/:id
export const getTourById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id).populate(
      "organizer",
      "name email image"
    );

    if (!tour) {
      res.status(404).json({ success: false, message: "Tour not found" });
      return;
    }

    res.status(200).json({ success: true, tour });
  } catch (error) {
    console.error("Get tour by id error:", error);
    res.status(500).json({ success: false, message: "Server error fetching tour" });
  }
};

// @desc    Get related tours (same category, exclude current)
// @route   GET /api/tours/:id/related
export const getRelatedTours = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      res.status(404).json({ success: false, message: "Tour not found" });
      return;
    }

    const relatedTours = await Tour.find({
      category: tour.category,
      _id: { $ne: tour._id },
    })
      .limit(4)
      .populate("organizer", "name");

    res.status(200).json({ success: true, tours: relatedTours });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching related tours" });
  }
};

// @desc    Create new tour (protected)
// @route   POST /api/tours
export const createTour = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const {
      title,
      shortDescription,
      fullDescription,
      price,
      duration,
      departureDate,
      location,
      category,
      images,
      maxGuests,
    } = req.body;

    if (
      !title ||
      !shortDescription ||
      !fullDescription ||
      !price ||
      !duration ||
      !departureDate ||
      !location ||
      !category ||
      !maxGuests
    ) {
      res.status(400).json({ success: false, message: "Please provide all required fields" });
      return;
    }

    const tour = await Tour.create({
      title,
      shortDescription,
      fullDescription,
      price,
      duration,
      departureDate,
      location,
      category,
      images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"],
      maxGuests,
      organizer: req.user._id,
    });

    res.status(201).json({ success: true, tour });
  } catch (error) {
    console.error("Create tour error:", error);
    res.status(500).json({ success: false, message: "Server error creating tour" });
  }
};

// @desc    Update tour (protected, owner or admin only)
// @route   PUT /api/tours/:id
export const updateTour = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      res.status(404).json({ success: false, message: "Tour not found" });
      return;
    }

    const isOwner = tour.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: "Not authorized to update this tour" });
      return;
    }

    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, tour: updatedTour });
  } catch (error) {
    console.error("Update tour error:", error);
    res.status(500).json({ success: false, message: "Server error updating tour" });
  }
};

// @desc    Delete tour (protected, owner or admin only)
// @route   DELETE /api/tours/:id
export const deleteTour = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      res.status(404).json({ success: false, message: "Tour not found" });
      return;
    }

    const isOwner = tour.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: "Not authorized to delete this tour" });
      return;
    }

    await tour.deleteOne();

    res.status(200).json({ success: true, message: "Tour deleted successfully" });
  } catch (error) {
    console.error("Delete tour error:", error);
    res.status(500).json({ success: false, message: "Server error deleting tour" });
  }
};

// @desc    Get tours created by logged-in user (or all tours if admin)
// @route   GET /api/tours/my/listings
export const getMyTours = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const query = req.user.role === "admin" ? {} : { organizer: req.user._id };

    const tours = await Tour.find(query)
      .populate("organizer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tours.length, tours });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching your tours" });
  }
};