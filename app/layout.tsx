import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gear Track",
  description: "Equipment loan & return management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
