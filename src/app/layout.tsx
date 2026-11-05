import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Graduate, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const logo = Graduate({ subsets: ["latin"], weight: "400", variable: "--font-logo" });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "VELOCITY | Unisex Gym",
  description: "Build strength. Own your pace. A modern unisex gym with a ground-floor, wheelchair-accessible facility and ample parking.",
};
export const viewport: Viewport = { themeColor: "#101211", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${logo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
