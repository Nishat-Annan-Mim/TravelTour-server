import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITour extends Document {
  title: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  duration: string; // e.g. "3 Days 2 Nights"
  departureDate: Date;
  location: string;
  category:
    | "Adventure"
    | "Cultural"
    | "Beach"
    | "Hiking"
    | "Wildlife"
    | "City Tour";
  images: string[];
  maxGuests: number;
  avgRating: number;
  numReviews: number;
  organizer: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TourSchema = new Schema<ITour>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    fullDescription: {
      type: String,
      required: [true, "Full description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
    },
    departureDate: {
      type: Date,
      required: [true, "Departure date is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Adventure",
        "Cultural",
        "Beach",
        "Hiking",
        "Wildlife",
        "City Tour",
      ],
      required: [true, "Category is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    maxGuests: {
      type: Number,
      required: [true, "Max guests is required"],
      min: [1, "Must allow at least 1 guest"],
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes for search/filter performance
TourSchema.index({ title: "text", location: "text" });
TourSchema.index({ category: 1, price: 1 });

export default mongoose.model<ITour>("Tour", TourSchema);
