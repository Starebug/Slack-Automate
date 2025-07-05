import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";  
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SlackConnect - Connect Your Slack Workspace",
  description: "Seamlessly connect and manage your Slack workspace integrations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
