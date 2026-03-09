const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc  Place a bid
// @route POST /api/bids
// @access Bidder
const placeBid = async (req, res, next) => {
  try {
    const { auctionId, amount } = req.body;
    const bidAmount = Number(amount);

    if (!auctionId || !bidAmount || bidAmount < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid auction or bid amount" });
    }

    // 1. Fetch auction
    const auction = await Auction.findById(auctionId).populate(
      "currentBidder",
      "name",
    );
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    // 2. Validate auction state
    const now = new Date();
    if (auction.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This auction is not currently active",
      });
    }
    if (auction.endTime <= now) {
      return res
        .status(400)
        .json({ success: false, message: "This auction has ended" });
    }
    if (auction.startTime > now) {
      return res
        .status(400)
        .json({ success: false, message: "This auction has not started yet" });
    }

    // 3. Cannot bid on own auction
    if (auction.createdBy.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Admin cannot bid on auctions" });
    }

    // 4. Validate bid amount
    const minRequired = Math.max(
      auction.minBid,
      (auction.currentBid || 0) + (auction.bidIncrement || 1),
    );
    if (bidAmount < minRequired) {
      return res.status(400).json({
        success: false,
        message: `Bid must be at least ${minRequired} credits`,
      });
    }

    // 5. Check bidder's credits
    const bidder = await User.findById(req.user._id);
    if (bidder.credits < bidAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You have ${bidder.credits} credits, bid requires ${bidAmount}`,
      });
    }

    // 6. Return credits to previous highest bidder (if different person)
    const previousBid = await Bid.findOne({
      auction: auctionId,
      status: "active",
    }).sort("-amount");

    if (previousBid) {
      if (previousBid.bidder.toString() === req.user._id.toString()) {
        // Bidder is raising their own bid — return old amount first
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { credits: previousBid.amount },
        });
        previousBid.creditsReturned = true;
      } else {
        // Different bidder outbid — return credits to previous bidder
        await User.findByIdAndUpdate(previousBid.bidder, {
          $inc: { credits: previousBid.amount },
        });
        previousBid.creditsReturned = true;

        // Notify outbid bidder
        const outbidUser = await User.findById(previousBid.bidder).select(
          "name",
        );
        await Notification.create({
          recipient: previousBid.bidder,
          type: "outbid",
          title: "You have been outbid!",
          message: `Someone outbid you on "${auction.title}". New leading bid: ${bidAmount} credits.`,
          auction: auctionId,
          metadata: { newBid: bidAmount, yourBid: previousBid.amount },
        });

        // Emit outbid notification via socket
        req.io.to(`user:${previousBid.bidder}`).emit("notification", {
          type: "outbid",
          title: "You have been outbid!",
          message: `New leading bid on "${auction.title}": ${bidAmount} credits`,
          auctionId,
        });
      }
      previousBid.status = "outbid";
      await previousBid.save();
    }

    // 7. Deduct credits from new bidder
    bidder.credits -= bidAmount;
    await bidder.save({ validateBeforeSave: false });

    // 8. Create bid record
    const newBid = await Bid.create({
      auction: auctionId,
      bidder: req.user._id,
      amount: bidAmount,
      status: "active",
    });

    // 9. Update auction
    auction.currentBid = bidAmount;
    auction.currentBidder = req.user._id;
    auction.totalBids += 1;
    await auction.save();

    // 10. Populate bid for response
    await newBid.populate("bidder", "name avatar");

    // 11. Emit real-time events
    const bidEvent = {
      bid: newBid,
      auction: {
        _id: auction._id,
        currentBid: bidAmount,
        currentBidder: {
          _id: req.user._id,
          name: bidder.name,
          avatar: bidder.avatar,
        },
        totalBids: auction.totalBids,
      },
    };
    req.io.to(`auction:${auctionId}`).emit("new_bid", bidEvent);
    req.io.to("admin_room").emit("live_bid_update", bidEvent);

    res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: newBid,
      remainingCredits: bidder.credits,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get bids for an auction
// @route GET /api/bids/auction/:auctionId
// @access Public
const getAuctionBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate("bidder", "name avatar")
      .sort("-createdAt")
      .limit(100);

    res.json({ success: true, data: bids });
  } catch (err) {
    next(err);
  }
};

// @desc  Get authenticated user's bid history
// @route GET /api/bids/my
// @access Bidder
const getMyBids = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await Bid.countDocuments({ bidder: req.user._id });
    const bids = await Bid.find({ bidder: req.user._id })
      .populate("auction", "title image status endTime currentBid winner")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: bids,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeBid, getAuctionBids, getMyBids };
