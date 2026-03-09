const { validationResult } = require("express-validator");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc  Get all auctions (with filters)
// @route GET /api/auctions
// @access Public
const getAuctions = async (req, res, next) => {
  try {
    const {
      status,
      category,
      search,
      page = 1,
      limit = 12,
      sort = "-createdAt",
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Auction.countDocuments(query);

    const auctions = await Auction.find(query)
      .populate("currentBidder", "name avatar")
      .populate("winner", "name avatar")
      .populate("createdBy", "name")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: auctions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single auction with bid history
// @route GET /api/auctions/:id
// @access Public
const getAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate("currentBidder", "name avatar")
      .populate("winner", "name avatar")
      .populate("createdBy", "name");

    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    const bids = await Bid.find({ auction: auction._id })
      .populate("bidder", "name avatar")
      .sort("-createdAt")
      .limit(50);

    res.json({ success: true, data: auction, bids });
  } catch (err) {
    next(err);
  }
};

// @desc  Create auction
// @route POST /api/auctions
// @access Admin
const createAuction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      title,
      description,
      image,
      category,
      startTime,
      endTime,
      minBid,
      bidIncrement,
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (end <= start) {
      return res
        .status(400)
        .json({ success: false, message: "End time must be after start time" });
    }
    if (end <= now) {
      return res
        .status(400)
        .json({ success: false, message: "End time must be in the future" });
    }

    const status = start <= now ? "active" : "pending";

    const auction = await Auction.create({
      title,
      description,
      image,
      category,
      startTime: start,
      endTime: end,
      minBid: Number(minBid),
      bidIncrement: Number(bidIncrement) || 1,
      status,
      createdBy: req.user._id,
    });

    // Emit new auction to all connected clients
    req.io.emit("auction_created", auction);

    res.status(201).json({ success: true, data: auction });
  } catch (err) {
    next(err);
  }
};

// @desc  Update auction
// @route PUT /api/auctions/:id
// @access Admin
const updateAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    if (auction.status === "ended" || auction.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot update a closed auction" });
    }

    // Prevent changing critical fields once bidding has started
    if (auction.status === "active" && auction.totalBids > 0) {
      const allowedFields = ["description", "image"];
      const attempted = Object.keys(req.body).filter(
        (k) => !allowedFields.includes(k),
      );
      if (attempted.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot change bids/timing after bidding has started",
        });
      }
    }

    const updated = await Auction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    req.io.emit("auction_updated", updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete (cancel) auction
// @route DELETE /api/auctions/:id
// @access Admin
const deleteAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    if (auction.status === "active" && auction.totalBids > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an active auction with bids. Close it first.",
      });
    }

    // Return credits to any existing bidders
    await returnAllBidCredits(auction._id);

    auction.status = "cancelled";
    await auction.save();

    req.io.emit("auction_cancelled", { auctionId: auction._id });
    res.json({ success: true, message: "Auction cancelled successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc  Admin force-close auction and declare winner
// @route POST /api/auctions/:id/close
// @access Admin
const closeAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    if (auction.status === "ended" || auction.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Auction is already closed" });
    }

    await finalizeAuction(auction, req.io);

    res.json({
      success: true,
      message: "Auction closed successfully",
      data: auction,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Helper: finalize an auction (declare winner, deduct credits, notify) ────
const finalizeAuction = async (auction, io) => {
  const highestBid = await Bid.findOne({
    auction: auction._id,
    status: "active",
  })
    .sort("-amount")
    .populate("bidder", "name email");

  auction.status = "ended";
  auction.closedAt = new Date();

  if (highestBid) {
    auction.winner = highestBid.bidder._id;
    auction.winningBid = highestBid.amount;

    // Mark bid as won (credits already deducted when bid was placed)
    highestBid.status = "won";
    await highestBid.save();

    // Notify winner
    await Notification.create({
      recipient: highestBid.bidder._id,
      type: "won",
      title: "🏆 You won the auction!",
      message: `Congratulations! You won "${auction.title}" with a bid of ${highestBid.amount} credits.`,
      auction: auction._id,
      metadata: { winningBid: highestBid.amount },
    });

    // Emit winner declared
    if (io) {
      io.to(`auction:${auction._id}`).emit("auction_ended", {
        auctionId: auction._id,
        winner: { _id: highestBid.bidder._id, name: highestBid.bidder.name },
        winningBid: highestBid.amount,
      });
      io.to(`user:${highestBid.bidder._id}`).emit("notification", {
        type: "won",
        title: "🏆 You won!",
        message: `You won "${auction.title}" with ${highestBid.amount} credits!`,
        auctionId: auction._id,
      });
    }
  } else {
    // No bids — just end the auction
    if (io) {
      io.to(`auction:${auction._id}`).emit("auction_ended", {
        auctionId: auction._id,
        winner: null,
        winningBid: 0,
      });
    }
  }

  // Notify all bidders who lost
  const losingBids = await Bid.find({
    auction: auction._id,
    status: "outbid",
    bidder: { $ne: auction.winner },
  }).distinct("bidder");

  for (const bidderId of losingBids) {
    await Notification.create({
      recipient: bidderId,
      type: "lost",
      title: "Auction ended",
      message: `The auction "${auction.title}" has ended. Better luck next time!`,
      auction: auction._id,
    });
  }

  await auction.save();
};

module.exports = {
  getAuctions,
  getAuction,
  createAuction,
  updateAuction,
  deleteAuction,
  closeAuction,
  finalizeAuction,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────
async function returnAllBidCredits(auctionId) {
  const activeBids = await Bid.find({
    auction: auctionId,
    status: "active",
    creditsReturned: false,
  });
  for (const bid of activeBids) {
    await User.findByIdAndUpdate(bid.bidder, { $inc: { credits: bid.amount } });
    bid.creditsReturned = true;
    bid.status = "returned";
    await bid.save();
  }
}
