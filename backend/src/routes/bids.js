const express = require("express");
const {
  placeBid,
  getAuctionBids,
  getMyBids,
  setAutoBid,
  cancelAutoBid,
  getAutoBid,
  getBidSuggestions,
} = require("../controllers/bidController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("bidder"), placeBid);
router.get("/my", protect, authorize("bidder"), getMyBids);
router.get("/auction/:auctionId", getAuctionBids);

// Auto-bid routes
router.post("/autobid", protect, authorize("bidder"), setAutoBid);
router.get("/autobid/:auctionId", protect, authorize("bidder"), getAutoBid);
router.delete(
  "/autobid/:auctionId",
  protect,
  authorize("bidder"),
  cancelAutoBid,
);

// Smart bid suggestions (public)
router.get("/suggestions/:auctionId", getBidSuggestions);

module.exports = router;
