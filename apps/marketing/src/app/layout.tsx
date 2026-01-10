import type { Metadata } from "next";
import { KoHo } from "next/font/google";
import "./globals.css";
import { PHProvider } from "@/components/PostHogProvider";

const koho = KoHo({
  variable: "--font-koho",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lila - Your Personal Skincare Specialist",
  description: "Advanced skin analysis and personalized routines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${koho.variable} antialiased font-sans`}
      >
        <PHProvider>
          {children}
        </PHProvider>
      </body>
    </html>
  );
}
