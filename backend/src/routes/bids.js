const express = require("express");
const {
  placeBid,
  getAuctionBids,
  getMyBids,
} = require("../controllers/bidController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("bidder"), placeBid);
router.get("/my", protect, authorize("bidder"), getMyBids);
router.get("/auction/:auctionId", getAuctionBids);

module.exports = router;
