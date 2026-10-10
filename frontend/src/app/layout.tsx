import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "ClassBridge — Multi-Institution Education Platform",
    template: "%s · ClassBridge",
  },
  description: "Connect. Learn. Teach. A multi-institution education platform for live virtual classrooms, course workflows, and campus management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased selection:bg-blue-600 selection:text-white`}>
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 flex flex-col">{children}</body>
    </html>
  );
}
