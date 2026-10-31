import "./globals.css";
import type { Metadata } from "next";
import { WizardProvider } from "@/components/WizardContext";
import BuildStoreWizard from "@/components/BuildStoreWizard";

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
        <WizardProvider>
          {children}
          <BuildStoreWizard />
        </WizardProvider>
      </body>
    </html>
  );
}
