import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GRIDSTRIKE // Off-Grid Infrastructure Defense",
  description:
    "Asymmetric system deployment and automated threat vector isolation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#0B0C0E] select-none text-[#E4E6EB]">
      <body
        className={`${inter.variable} ${spaceMono.variable} font-sans antialiased min-h-screen relative overflow-x-hidden`}
      >
        {/* Structural grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none z-50 mix-blend-screen"
          style={{
            backgroundImage: `linear-gradient(#E4E6EB 1px, transparent 1px), linear-gradient(90deg, #E4E6EB 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Top status line */}
        <div className="fixed top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent z-50 opacity-80" />

        <main className="relative z-10 w-full">{children}</main>
      </body>
    </html>
  );
}
