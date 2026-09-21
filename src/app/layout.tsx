import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelioCoreOS",
  description: "Solar EPC operations platform showcase",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders><NuqsAdapter>{children}</NuqsAdapter></AppProviders>
      </body>
    </html>
  );
}
