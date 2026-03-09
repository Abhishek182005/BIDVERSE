import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "BidVerse — Live Auction Platform",
  description:
    "Professional real-time auction platform. Bid, win, and manage auctions with ease.",
  keywords: "auction, bidding, live auction, online auction, credits",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
