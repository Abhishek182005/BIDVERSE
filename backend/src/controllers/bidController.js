const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AutoBid = require("../models/AutoBid");

// --- Internal: execute a bid without HTTP context ---
// Used by both the HTTP placeBid handler and the auto-bid system.
async function _executeBidInternal(
  auctionId,
  bidderId,
  bidAmount,
  io,
  isAutoBid = false,
  suppressChain = false,
) {
  const bidderIdStr = bidderId.toString();

  const auction = await Auction.findById(auctionId).populate(
    "currentBidder",
    "name",
  );
  if (!auction) return null;

  const now = new Date();
  if (
    auction.status !== "active" ||
    auction.endTime <= now ||
    auction.startTime > now
  )
    return null;

  const minRequired = Math.max(
    auction.minBid,
    (auction.currentBid || 0) + (auction.bidIncrement || 1),
  );
  if (bidAmount < minRequired) return null;

  const bidder = await User.findById(bidderId);
  if (!bidder || bidder.credits < bidAmount) return null;

  // Prevent auto-bid from firing when this user is already the leader
  if (isAutoBid && auction.currentBidder?._id?.toString() === bidderIdStr)
    return null;

  const previousBid = await Bid.findOne({
    auction: auctionId,
    status: "active",
  }).sort("-amount");
  let previousBidderId = null;

  if (previousBid) {
    previousBidderId = previousBid.bidder.toString();

    if (previousBidderId === bidderIdStr) {
      // Self-raise: return own previous bid amount first
      await User.findByIdAndUpdate(bidderId, {
        $inc: { credits: previousBid.amount },
      });
      previousBid.creditsReturned = true;
    } else {
      await User.findByIdAndUpdate(previousBid.bidder, {
        $inc: { credits: previousBid.amount },
      });
      previousBid.creditsReturned = true;

      const prefix = isAutoBid ? "An auto-bid" : "Someone";
      await Notification.create({
        recipient: previousBid.bidder,
        type: "outbid",
        title: "You have been outbid!",
        message: `${prefix} outbid you on "${auction.title}". New leading bid: ${bidAmount} credits.`,
        auction: auctionId,
        metadata: { newBid: bidAmount, yourBid: previousBid.amount },
      });

      io?.to(`user:${previousBid.bidder}`).emit("notification", {
        type: "outbid",
        title: "You have been outbid!",
        message: `New leading bid on "${auction.title}": ${bidAmount} credits`,
        auctionId,
      });
    }
    previousBid.status = "outbid";
    await previousBid.save();
  }

  bidder.credits -= bidAmount;
  await bidder.save({ validateBeforeSave: false });

  const newBid = await Bid.create({
    auction: auctionId,
    bidder: bidderId,
    amount: bidAmount,
    status: "active",
    isAutoBid,
  });

  auction.currentBid = bidAmount;
  auction.currentBidder = bidderId;
  auction.totalBids += 1;
  await auction.save();

  await newBid.populate("bidder", "name avatar");

  const bidEvent = {
    bid: newBid,
    auction: {
      _id: auction._id,
      currentBid: bidAmount,
      currentBidder: {
        _id: bidderId,
        name: bidder.name,
        avatar: bidder.avatar,
      },
      totalBids: auction.totalBids,
    },
  };
  io?.to(`auction:${auctionId}`).emit("new_bid", bidEvent);
  io?.to("admin_room").emit("live_bid_update", bidEvent);

  // Trigger auto-bid for the user who was just outbid (chain-safe)
  // suppressChain is set when we're already inside _triggerAutoBid's loop.
  if (!suppressChain && previousBidderId && previousBidderId !== bidderIdStr) {
    setImmediate(() =>
      _triggerAutoBid(
        auctionId.toString(),
        previousBidderId,
        bidAmount,
        auction.bidIncrement || 1,
        io,
      ),
    );
  }

  return newBid;
}

// Per-auction lock — prevents two concurrent auto-bid chains on the same auction
const _autoBidLocks = new Set();

// --- Internal: trigger auto-bid response for a freshly outbid user ---
// Resolves the full back-and-forth chain in one loop (max 20 rounds) so that
// two players with auto-bids don't spin forever.
// A per-auction lock stops concurrent chains; a 300ms delay between rounds
// prevents CPU/DB storms when N users all have auto-bids active.
async function _triggerAutoBid(
  auctionId,
  bidderId,
  currentBid,
  bidIncrement,
  io,
) {
  // If a chain is already running for this auction, skip — it will handle it
  if (_autoBidLocks.has(auctionId)) return;
  _autoBidLocks.add(auctionId);

  const MAX_ROUNDS = 20;
  let round = 0;
  let nextBidderId = bidderId;
  let latestBid = currentBid;

  try {
    while (round < MAX_ROUNDS) {
      round++;
      try {
        const autoBid = await AutoBid.findOne({
          auction: auctionId,
          bidder: nextBidderId,
          isActive: true,
        });
        if (!autoBid) break; // this user has no auto-bid — chain ends

        const autoAmount = latestBid + bidIncrement;

        if (autoAmount > autoBid.maxAmount) {
          // Budget exhausted — deactivate and notify, then stop
          autoBid.isActive = false;
          await autoBid.save();

          const auction = await Auction.findById(auctionId).select("title");
          await Notification.create({
            recipient: nextBidderId,
            type: "outbid",
            title: "Auto-bid limit reached",
            message: `Your auto-bid for "${auction?.title}" has reached its limit of ${autoBid.maxAmount} credits and has been deactivated.`,
            auction: auctionId,
          });
          io?.to(`user:${nextBidderId}`).emit("notification", {
            type: "outbid",
            title: "Auto-bid limit reached",
            message: `Auto-bid for "${auction?.title}" exhausted (max: ${autoBid.maxAmount} cr)`,
            auctionId,
          });
          break;
        }

        // Place the auto-bid. Pass a flag so _executeBidInternal does NOT
        // queue another _triggerAutoBid (we manage the loop right here).
        const newBid = await _executeBidInternal(
          auctionId,
          nextBidderId,
          autoAmount,
          io,
          true,
          true, // suppressChain
        );
        if (!newBid) break; // bid failed (e.g. auction ended mid-chain)

        // The person who was just outbid is whoever held the bid before this round.
        // _executeBidInternal returns the new bid; we need the previous leader.
        // We stored previousBidderId inside _executeBidInternal but can't access it here.
        // Instead, re-query the auction to find the new state and determine if the
        // previously-leading user also has an auto-bid.
        const updatedAuction = await Auction.findById(auctionId).select(
          "currentBidder currentBid status endTime",
        );
        if (!updatedAuction || updatedAuction.status !== "active") break;

        // The next candidate to respond is the user who JUST got outbid, which is
        // the one who placed the bid that `nextBidderId` just outbid — i.e., the
        // previous leader before this round. We know they had `latestBid`.
        // Find their bid record to get their ID.
        const justOutbidBid = await Bid.findOne({
          auction: auctionId,
          status: "outbid",
          amount: latestBid,
        }).sort("-createdAt");

        if (!justOutbidBid) break;
        const justOutbidUserId = justOutbidBid.bidder.toString();
        if (justOutbidUserId === nextBidderId.toString()) break; // same user, stop

        latestBid = autoAmount;
        nextBidderId = justOutbidUserId;
        bidIncrement = updatedAuction.bidIncrement || bidIncrement;

        // 300ms cooldown — prevents DB/CPU storms with many concurrent auto-bidders
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error("Auto-bid chain error (round %d):", round, err.message);
        break;
      }
    }
  } finally {
    _autoBidLocks.delete(auctionId);
  }

  if (round >= MAX_ROUNDS) {
    console.warn(
      "Auto-bid chain hit MAX_ROUNDS (%d) for auction %s — stopping.",
      MAX_ROUNDS,
      auctionId,
    );
  }
}

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

    const auction = await Auction.findById(auctionId).populate(
      "currentBidder",
      "name",
    );
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

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
    if (auction.createdBy.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Admin cannot bid on auctions" });
    }

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

    const bidder = await User.findById(req.user._id);
    if (bidder.credits < bidAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You have ${bidder.credits} credits, bid requires ${bidAmount}`,
      });
    }

    const newBid = await _executeBidInternal(
      auctionId,
      req.user._id,
      bidAmount,
      req.io,
      false,
    );
    if (!newBid) {
      return res.status(400).json({
        success: false,
        message: "Could not place bid. Please refresh and try again.",
      });
    }

    const updatedBidder = await User.findById(req.user._id).select("credits");
    res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: newBid,
      remainingCredits: updatedBidder.credits,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Set or update auto-bid max budget for an auction
// @route POST /api/bids/autobid
// @access Bidder
const setAutoBid = async (req, res, next) => {
  try {
    const { auctionId, maxAmount } = req.body;

    if (!auctionId || !maxAmount) {
      return res.status(400).json({
        success: false,
        message: "auctionId and maxAmount are required",
      });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }
    if (auction.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Auto-bid can only be set on active auctions",
      });
    }

    const minNext = Math.max(
      auction.minBid,
      (auction.currentBid || 0) + (auction.bidIncrement || 1),
    );
    if (Number(maxAmount) < minNext) {
      return res.status(400).json({
        success: false,
        message: `Max amount must be at least ${minNext} credits`,
      });
    }

    const autoBid = await AutoBid.findOneAndUpdate(
      { auction: auctionId, bidder: req.user._id },
      { maxAmount: Number(maxAmount), isActive: true },
      { upsert: true, new: true },
    );

    res.json({
      success: true,
      message: "Auto-bid activated successfully",
      data: autoBid,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Cancel auto-bid for an auction
// @route DELETE /api/bids/autobid/:auctionId
// @access Bidder
const cancelAutoBid = async (req, res, next) => {
  try {
    await AutoBid.findOneAndUpdate(
      { auction: req.params.auctionId, bidder: req.user._id },
      { isActive: false },
    );
    res.json({ success: true, message: "Auto-bid cancelled" });
  } catch (err) {
    next(err);
  }
};

// @desc  Get current user's active auto-bid for an auction
// @route GET /api/bids/autobid/:auctionId
// @access Bidder
const getAutoBid = async (req, res, next) => {
  try {
    const autoBid = await AutoBid.findOne({
      auction: req.params.auctionId,
      bidder: req.user._id,
      isActive: true,
    });
    res.json({ success: true, data: autoBid || null });
  } catch (err) {
    next(err);
  }
};

// @desc  Get smart bid suggestions for an auction
// @route GET /api/bids/suggestions/:auctionId
// @access Public
const getBidSuggestions = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.auctionId).select(
      "minBid currentBid bidIncrement startTime endTime status",
    );
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    const minNext = Math.max(
      auction.minBid,
      (auction.currentBid || 0) + (auction.bidIncrement || 1),
    );

    // Analyse recent bid increments to estimate competitive pace
    const recentBids = await Bid.find({ auction: req.params.auctionId })
      .sort("-createdAt")
      .limit(10)
      .select("amount");

    let avgIncrement = auction.bidIncrement || 1;
    if (recentBids.length >= 2) {
      const increments = [];
      for (let i = 0; i < recentBids.length - 1; i++) {
        const diff = recentBids[i].amount - recentBids[i + 1].amount;
        if (diff > 0) increments.push(diff);
      }
      if (increments.length > 0) {
        avgIncrement = Math.round(
          increments.reduce((a, b) => a + b, 0) / increments.length,
        );
      }
    }

    // Time urgency: how far into the auction are we?
    const now = new Date();
    const totalDuration =
      new Date(auction.endTime) - new Date(auction.startTime);
    const elapsed = now - new Date(auction.startTime);
    const urgency = Math.min(Math.max(elapsed / totalDuration, 0), 1);
    const urgencyMultiplier = urgency > 0.8 ? 2.5 : urgency > 0.5 ? 1.5 : 1;

    const competitive = Math.round(minNext + avgIncrement * urgencyMultiplier);
    const aggressive = Math.round(
      minNext + avgIncrement * 2.5 * urgencyMultiplier,
    );

    res.json({
      success: true,
      data: {
        safe: minNext,
        competitive: Math.max(competitive, minNext + 1),
        aggressive: Math.max(aggressive, minNext + 2),
        urgencyLevel: urgency > 0.8 ? "high" : urgency > 0.5 ? "medium" : "low",
      },
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

module.exports = {
  placeBid,
  getAuctionBids,
  getMyBids,
  setAutoBid,
  cancelAutoBid,
  getAutoBid,
  getBidSuggestions,
};
