const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc  Get authenticated user profile
// @route GET /api/users/profile
// @access Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc  Update profile (name, avatar)
// @route PUT /api/users/profile
// @access Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const allowedUpdates = {};
    if (name) allowedUpdates.name = name.trim().substring(0, 60);
    if (avatar) allowedUpdates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc  Get notifications
// @route GET /api/users/notifications
// @access Private
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { recipient: req.user._id };
    if (unreadOnly === "true") query.read = false;

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    const notifications = await Notification.find(query)
      .populate("auction", "title image")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: notifications,
      unreadCount,
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

// @desc  Mark notification(s) as read
// @route PUT /api/users/notifications/read
// @access Private
const markNotificationsRead = async (req, res, next) => {
  try {
    const { notificationIds, all = false } = req.body;

    if (all) {
      await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { read: true },
      );
    } else if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: req.user._id },
        { read: true },
      );
    }

    res.json({ success: true, message: "Notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationsRead,
};
