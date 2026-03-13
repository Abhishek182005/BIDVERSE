import { format } from "date-fns";

/**
 * Generates and downloads a full PDF report for a single auction.
 * @param {Object} auction  - auction document
 * @param {Array}  bids     - full bid list for the auction
 * @param {Array}  uniqueBidders - pre-computed participants list
 */
export async function downloadAuctionPDF(auction, bids, uniqueBidders) {
  // Dynamic import so the heavy library is only loaded when needed
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const col1 = margin;
  let y = 0;

  // ── Header banner ──────────────────────────────────────────────────────────
  doc.setFillColor(29, 114, 245); // brand blue
  doc.rect(0, 0, pageW, 22, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("BidVerse", margin, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Auction Report", pageW - margin, 14, { align: "right" });
  y = 30;

  // ── Auction title & meta ───────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 30);
  doc.text(auction.title, margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 120);
  doc.text(
    `Category: ${auction.category}   |   Status: ${auction.status.toUpperCase()}   |   Generated: ${format(new Date(), "MMM d, yyyy HH:mm")}`,
    margin,
    y,
  );
  y += 5;

  // horizontal rule
  doc.setDrawColor(220, 220, 230);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // ── Description ───────────────────────────────────────────────────────────
  if (auction.description) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 60);
    doc.text("Description", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 90);
    const lines = doc.splitTextToSize(auction.description, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 5;
  }

  // ── Two-column details grid ────────────────────────────────────────────────
  const leftX = margin;
  const rightX = pageW / 2 + 2;
  const sectionY = y;

  const drawKV = (x, curY, key, val, valColor) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 140);
    doc.text(key, x, curY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...(valColor || [20, 20, 30]));
    doc.text(String(val), x, curY + 4.5);
    return curY + 11;
  };

  // Left column
  let ly = sectionY;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(29, 114, 245);
  doc.text("BID DETAILS", leftX, ly);
  ly += 4;
  ly = drawKV(leftX, ly, "Min Bid", `${auction.minBid} cr`);
  ly = drawKV(leftX, ly, "Bid Increment", `+${auction.bidIncrement} cr`);
  ly = drawKV(leftX, ly, "Total Bids", auction.totalBids);
  ly = drawKV(leftX, ly, "Participants", uniqueBidders.length);
  if (auction.status === "ended" || auction.winningBid) {
    ly = drawKV(
      leftX,
      ly,
      "Winning / Final Bid",
      `${auction.winningBid || auction.currentBid} cr`,
      [183, 132, 0],
    );
  } else {
    ly = drawKV(
      leftX,
      ly,
      "Current Bid",
      `${auction.currentBid || auction.minBid} cr`,
      [183, 132, 0],
    );
  }

  // Right column
  let ry = sectionY;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(29, 114, 245);
  doc.text("TIMELINE", rightX, ry);
  ry += 4;
  ry = drawKV(
    rightX,
    ry,
    "Start Time",
    format(new Date(auction.startTime), "MMM d, yyyy HH:mm"),
  );
  ry = drawKV(
    rightX,
    ry,
    "End Time",
    format(new Date(auction.endTime), "MMM d, yyyy HH:mm"),
  );
  if (auction.createdAt) {
    ry = drawKV(
      rightX,
      ry,
      "Created On",
      format(new Date(auction.createdAt), "MMM d, yyyy HH:mm"),
    );
  }

  y = Math.max(ly, ry) + 4;

  // ── Winner banner ─────────────────────────────────────────────────────────
  if (auction.winner) {
    doc.setFillColor(255, 248, 220);
    doc.setDrawColor(215, 180, 0);
    doc.roundedRect(margin, y, pageW - margin * 2, 14, 3, 3, "FD");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 100, 0);
    doc.text(
      `🏆  WINNER: ${auction.winner.name}   —   Winning bid: ${auction.winningBid} cr`,
      margin + 4,
      y + 9,
    );
    y += 20;
  }

  // ── Participants table ────────────────────────────────────────────────────
  if (uniqueBidders.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 30);
    doc.text("Participants", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Bidder", "Total Bids", "Highest Bid", "Last Active"]],
      body: uniqueBidders.map((b, i) => [
        i + 1,
        b.name,
        b.bidCount,
        `${b.highestBid} cr`,
        format(new Date(b.lastBid), "MMM d, HH:mm"),
      ]),
      headStyles: {
        fillColor: [29, 114, 245],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        3: { textColor: [180, 130, 0], fontStyle: "bold" },
      },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Full bid history table ────────────────────────────────────────────────
  if (bids.length > 0) {
    // Add a new page if not enough space
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 30);
    doc.text(`Bid History  (${bids.length} bids total)`, margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Bidder", "Amount", "Status", "Time"]],
      body: bids
        .slice(0, 200)
        .map((bid, i) => [
          i + 1,
          bid.bidder?.name || "—",
          `${bid.amount} cr`,
          bid.status?.toUpperCase() || "—",
          format(new Date(bid.createdAt), "MMM d, HH:mm:ss"),
        ]),
      headStyles: {
        fillColor: [29, 114, 245],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 7.5, textColor: [40, 40, 60] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        2: { textColor: [180, 130, 0], fontStyle: "bold" },
        3: { halign: "center" },
      },
    });
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 180);
    doc.text(
      `BidVerse — Auction Report for "${auction.title}"  |  Page ${p} of ${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" },
    );
  }

  const fileName = `auction-${auction.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-report.pdf`;
  doc.save(fileName);
}
