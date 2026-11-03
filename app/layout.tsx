import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Mall of Projects",
  description: "A clean social space with storefronts. Humans only. Build, sell, and grow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
