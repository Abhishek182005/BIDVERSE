const express = require("express");
const {
  getAllUsers,
  assignCredits,
  toggleUserStatus,
  getStats,
  getAuctionReport,
  getReports,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.put("/users/:id/credits", assignCredits);
router.put("/users/:id/toggle-status", toggleUserStatus);
router.get("/reports", getReports);
router.get("/reports/:auctionId", getAuctionReport);

module.exports = router;
