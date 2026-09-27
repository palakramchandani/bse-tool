import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Circular Lookup — Market disclosures, simplified",
  description: "Search BSE and NSE corporate announcements in one place.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
