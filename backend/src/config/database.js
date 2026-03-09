const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`\x1b[32m✓ MongoDB connected: ${conn.connection.host}\x1b[0m`);

    // Seed admin user if flag is set
    if (process.env.ADMIN_SEED === "true") {
      await seedAdmin();
    }
  } catch (error) {
    console.error(
      `\x1b[31m✗ MongoDB connection error: ${error.message}\x1b[0m`,
    );
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    const User = require("../models/User");
    const existing = await User.findOne({ email: "admin@bidverse.com" });
    if (!existing) {
      const hashed = await bcrypt.hash("Admin@123", 12);
      await User.create({
        name: "BidVerse Admin",
        email: "admin@bidverse.com",
        password: hashed,
        role: "admin",
      });
      console.log(
        "\x1b[33m⚡ Default admin user seeded (admin@bidverse.com / Admin@123)\x1b[0m",
      );
    }
  } catch (err) {
    // Non-fatal – model may not exist on first run
  }
};

module.exports = connectDB;
