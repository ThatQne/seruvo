import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seruvo - Modern Image Hosting Platform",
  description: "A clean, minimalist image hosting platform with drag-and-drop uploads, album management, and API access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} font-sans antialiased`}
      >
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
