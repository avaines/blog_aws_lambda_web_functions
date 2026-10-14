import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Fin & Feast — Big flavours. Tiny mouths.",
  description:
    "Your favourite underwater takeaway. A playful goldfish food delivery demo.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
