import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Level Up SQL - AI SQL Coaching",
  description: "Level up your SQL expertise with practice questions and personalized feedback from an AI SQL coaching agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
