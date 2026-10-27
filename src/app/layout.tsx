import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Teamville | School workspace", template: "%s | Teamville" },
  description: "The private school management workspace for Teamville Montessori School, Ibadan.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-NG"><body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;
}
