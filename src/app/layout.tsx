import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import { SettingsProvider } from "@/hooks/useSettings";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-press-start-2p",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maze Chase",
  description: "A mobile-first arcade maze game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pressStart2P.variable}>
      <body className="min-h-screen bg-black text-white">
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
