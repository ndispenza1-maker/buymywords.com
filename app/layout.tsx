import "./globals.css";
import type { Metadata } from "next";
import ThemeInit from "@/components/ThemeInit";

export const metadata: Metadata = {
  title: "The Mall of Projects",
  description: "A clean social space with storefronts. Humans only. Build, sell, and grow.",
  verification: {
    google: "nVrGrWbSOQoOKFVpCEvuEiHgmPexRe954P7t8xVTE-4",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
