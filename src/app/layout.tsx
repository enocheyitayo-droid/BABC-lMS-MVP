import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "BABC | School portal", template: "%s | BABC" },
  description: "The staff collaboration and academic portal for Bodija-Ashi Baptist College, Ibadan.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-NG"><body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;
}
