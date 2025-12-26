import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import Navigation from "@/components/Navigation";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SFF Lead Radar - Lead Generation & CRM",
  description: "Find, qualify, pitch, and track video editing leads for ShortFormFactory",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {session && <Navigation />}
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
