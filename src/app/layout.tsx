import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelioCoreOS",
  description: "Solar EPC operations platform showcase",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
