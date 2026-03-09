const express = require("express");
const { body } = require("express-validator");
const {
  getAuctions,
  getAuction,
  createAuction,
  updateAuction,
  deleteAuction,
  closeAuction,
} = require("../controllers/auctionController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const auctionValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 120 }),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 2000 }),
  body("startTime").isISO8601().withMessage("Valid start time is required"),
  body("endTime").isISO8601().withMessage("Valid end time is required"),
  body("minBid")
    .isNumeric()
    .custom((v) => v >= 1)
    .withMessage("Minimum bid must be >= 1"),
  body("category")
    .optional()
    .isIn([
      "Art",
      "Electronics",
      "Jewelry",
      "Collectibles",
      "Fashion",
      "Vehicles",
      "Real Estate",
      "Other",
    ]),
];

router.get("/", getAuctions);
router.get("/:id", getAuction);

router.post("/", protect, authorize("admin"), auctionValidation, createAuction);
router.put("/:id", protect, authorize("admin"), updateAuction);
router.delete("/:id", protect, authorize("admin"), deleteAuction);
router.post("/:id/close", protect, authorize("admin"), closeAuction);

module.exports = router;
