const User = require("../models/User");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Notification = require("../models/Notification");

// @desc  Get all bidders
// @route GET /api/admin/users
// @access Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: "bidder" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit));

    // Attach bid counts per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalBids = await Bid.countDocuments({ bidder: user._id });
        const wonBids = await Bid.countDocuments({
          bidder: user._id,
          status: "won",
        });
        return { ...user.toObject(), totalBids, wonBids };
      }),
    );

    res.json({
      success: true,
      data: usersWithStats,
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

// @desc  Assign / update credits for a bidder
// @route PUT /api/admin/users/:id/credits
// @access Admin
const assignCredits = async (req, res, next) => {
  try {
    const { credits, operation = "set" } = req.body; // operation: 'set' | 'add' | 'subtract'

    if (
      credits === undefined ||
      isNaN(Number(credits)) ||
      Number(credits) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Credits must be a non-negative number",
      });
    }

    const user = await User.findOne({ _id: req.params.id, role: "bidder" });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Bidder not found" });
    }

    let newCredits;
    if (operation === "add") {
      newCredits = user.credits + Number(credits);
    } else if (operation === "subtract") {
      newCredits = Math.max(0, user.credits - Number(credits));
    } else {
      newCredits = Number(credits);
    }

    user.credits = newCredits;
    await user.save({ validateBeforeSave: false });

    // Notify bidder
    await Notification.create({
      recipient: user._id,
      type: "credits_assigned",
      title: "Credits Updated",
      message: `Your credit balance has been updated to ${newCredits} credits by admin.`,
      metadata: { credits: newCredits, operation },
    });

    res.json({
      success: true,
      message: `Credits updated to ${newCredits}`,
      data: { userId: user._id, credits: user.credits },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Toggle user active status
// @route PUT /api/admin/users/:id/toggle-status
// @access Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "bidder" });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Bidder not found" });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      data: { userId: user._id, isActive: user.isActive },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get admin dashboard stats
// @route GET /api/admin/stats
// @access Admin
const getStats = async (req, res, next) => {
  try {
    const [
      totalAuctions,
      activeAuctions,
      endedAuctions,
      pendingAuctions,
      totalBidders,
      totalBids,
      recentBids,
    ] = await Promise.all([
      Auction.countDocuments(),
      Auction.countDocuments({ status: "active" }),
      Auction.countDocuments({ status: "ended" }),
      Auction.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "bidder" }),
      Bid.countDocuments(),
      Bid.find()
        .populate("bidder", "name avatar")
        .populate("auction", "title image")
        .sort("-createdAt")
        .limit(10),
    ]);

    // Credits in circulation
    const creditStats = await User.aggregate([
      { $match: { role: "bidder" } },
      { $group: { _id: null, totalCredits: { $sum: "$credits" } } },
    ]);
    const totalCreditsInCirculation = creditStats[0]?.totalCredits || 0;

    // Bids per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const bidsPerDay = await Bid.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top auctions by bid count
    const topAuctions = await Auction.find({
      status: { $in: ["active", "ended"] },
    })
      .sort("-totalBids")
      .limit(5)
      .select("title totalBids currentBid status endTime image");

    res.json({
      success: true,
      data: {
        auctions: {
          total: totalAuctions,
          active: activeAuctions,
          ended: endedAuctions,
          pending: pendingAuctions,
        },
        bidders: { total: totalBidders, totalCreditsInCirculation },
        bids: { total: totalBids },
        recentBids,
        bidsPerDay,
        topAuctions,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get auction report with full bid history
// @route GET /api/admin/reports/:auctionId
// @access Admin
const getAuctionReport = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.auctionId)
      .populate("winner", "name email avatar")
      .populate("currentBidder", "name email")
      .populate("createdBy", "name");

    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    const bids = await Bid.find({ auction: auction._id })
      .populate("bidder", "name email avatar")
      .sort("-amount");

    // Unique bidders
    const uniqueBidderIds = [
      ...new Set(bids.map((b) => b.bidder._id.toString())),
    ];

    res.json({
      success: true,
      data: {
        auction,
        bids,
        stats: {
          totalBids: bids.length,
          uniqueBidders: uniqueBidderIds.length,
          highestBid: bids[0]?.amount || 0,
          lowestBid: bids[bids.length - 1]?.amount || 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get all auction reports list
// @route GET /api/admin/reports
// @access Admin
const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Auction.countDocuments();

    const auctions = await Auction.find()
      .populate("winner", "name avatar")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .select(
        "title category status totalBids currentBid winningBid winner closedAt minBid createdAt",
      );

    // Summary aggregations
    const [bidAgg] = await Bid.aggregate([
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          highestBid: { $max: "$amount" },
          avgBids: { $avg: 1 },
        },
      },
    ]);

    const [auctionAgg] = await Auction.aggregate([
      { $group: { _id: null, avgBids: { $avg: "$totalBids" } } },
    ]);

    res.json({
      success: true,
      data: {
        auctions,
        total,
        totalBids: bidAgg?.totalBids || 0,
        highestBid: bidAgg?.highestBid || 0,
        avgBids: auctionAgg?.avgBids || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  assignCredits,
  toggleUserStatus,
  getStats,
  getAuctionReport,
  getReports,
};
