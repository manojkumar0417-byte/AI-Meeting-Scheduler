import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Real-Time Meeting Scheduler",
  description: "Find real Google Calendar availability and schedule meetings with local Ollama AI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
