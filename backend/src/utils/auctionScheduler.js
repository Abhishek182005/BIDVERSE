const cron = require("node-cron");
const Auction = require("../models/Auction");
const { finalizeAuction } = require("../controllers/auctionController");

/**
 * Runs every minute.
 * - Activates auctions whose startTime has passed (pending → active)
 * - Finalizes auctions whose endTime has passed (active → ended)
 */
const startAuctionScheduler = (io) => {
  // Every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
      // Activate pending auctions that have started
      const toActivate = await Auction.find({
        status: "pending",
        startTime: { $lte: now },
      });

      for (const auction of toActivate) {
        auction.status = "active";
        await auction.save();
        io.emit("auction_activated", {
          auctionId: auction._id,
          title: auction.title,
        });
        console.log(`[Scheduler] Activated auction: ${auction.title}`);
      }

      // End active auctions that have expired
      const toEnd = await Auction.find({
        status: "active",
        endTime: { $lte: now },
      });

      for (const auction of toEnd) {
        try {
          await finalizeAuction(auction, io);
          console.log(`[Scheduler] Ended auction: ${auction.title}`);
        } catch (err) {
          console.error(
            `[Scheduler] Error ending auction ${auction._id}:`,
            err.message,
          );
        }
      }
    } catch (err) {
      console.error("[Scheduler] Error:", err.message);
    }
  });

  console.log("\x1b[32m✓ Auction scheduler started (runs every minute)\x1b[0m");
};

module.exports = { startAuctionScheduler };
