import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReview extends Document {
  tour: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    tour: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true },
);

// Prevent duplicate reviews from same user on same tour
ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

export default mongoose.model<IReview>("Review", ReviewSchema);
