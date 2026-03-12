const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Bid amount must be positive"],
    },
    status: {
      type: String,
      enum: ["active", "outbid", "won", "returned"],
      default: "active",
    },
    // Track if credits have been returned for this bid
    creditsReturned: {
      type: Boolean,
      default: false,
    },
    // Placed automatically by the auto-bid system
    isAutoBid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Compound index for fast per-auction bid lookups
bidSchema.index({ auction: 1, createdAt: -1 });
bidSchema.index({ bidder: 1, createdAt: -1 });
bidSchema.index({ auction: 1, status: 1 });

module.exports = mongoose.model("Bid", bidSchema);
