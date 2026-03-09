const express = require("express");
const {
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationsRead,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/notifications", getNotifications);
router.put("/notifications/read", markNotificationsRead);

module.exports = router;
