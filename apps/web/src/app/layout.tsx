import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "visualize",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="bg-page text-ink min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
