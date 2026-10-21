// import type { Metadata } from "next";
// import "./globals.css";

// export const metadata: Metadata = {
//   title: "AI Real-Time Meeting Scheduler",
//   description: "Find real Google Calendar availability and schedule meetings with local Ollama AI."
// };

// export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
//   return (
//     <html lang="en">
//       <body>{children}</body>
//     </html>
//   );
// }




import type { Metadata } from "next";
import type { ReactNode } from "react";
// @ts-expect-error Next.js handles CSS imports at build time.
import "./globals.css";


export const metadata: Metadata = {
  title: "AI Real-Time Meeting Scheduler",
  description:
    "Find real Google Calendar availability and schedule meetings with local Ollama AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
