import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuperWorld - Proof-of-Place Validation",
  description: "Validate location-tagged social media posts with geo-consistency scoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

