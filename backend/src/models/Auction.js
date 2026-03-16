const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800",
    },
    category: {
      type: String,
      enum: [
        "Art",
        "Electronics",
        "Jewellery",
        "Collectibles",
        "Clothing",
        "Vehicles",
        "Sports",
        "Real Estate",
        "Other",
      ],
      default: "Other",
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    minBid: {
      type: Number,
      required: [true, "Minimum bid is required"],
      min: [1, "Minimum bid must be at least 1 credit"],
    },
    bidIncrement: {
      type: Number,
      default: 1,
      min: [1, "Bid increment must be at least 1"],
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    currentBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "active", "ended", "cancelled"],
      default: "pending",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    winningBid: {
      type: Number,
      default: 0,
    },
    totalBids: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Virtual: is currently active
auctionSchema.virtual("isActive").get(function () {
  const now = new Date();
  return (
    this.status === "active" && this.startTime <= now && this.endTime > now
  );
});

// Index for efficient status+time queries (used by scheduler)
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model("Auction", auctionSchema);
