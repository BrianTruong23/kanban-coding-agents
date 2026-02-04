import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban for Coding Agents",
  description: "Manage tasks assigned to coding agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
