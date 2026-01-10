import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueryCoach - SQL Tutoring Agent",
  description: "Learn SQL with personalized feedback from an AI tutor",
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
