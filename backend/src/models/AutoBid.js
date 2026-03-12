const mongoose = require("mongoose");

const autoBidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maxAmount: {
      type: Number,
      required: true,
      min: [1, "Max amount must be positive"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// One auto-bid setting per bidder per auction
autoBidSchema.index({ auction: 1, bidder: 1 }, { unique: true });

module.exports = mongoose.model("AutoBid", autoBidSchema);
