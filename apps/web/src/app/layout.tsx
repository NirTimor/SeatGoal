import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeatGoal - Football Tickets",
  description: "Purchase tickets for football games in Israel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

