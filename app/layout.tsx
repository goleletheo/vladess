import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aviator Predictor Analytics",
  description: "Experimental crash-game statistics, risk modelling, and prediction evaluation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
