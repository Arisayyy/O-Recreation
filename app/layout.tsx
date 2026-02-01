import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/app/components/navbar";
import { ReplicateProvider } from "@/app/components/replicate-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orchid",
  description: "Orchid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <ReplicateProvider>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
              <main className="relative flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col">
                  <Navbar />
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </ReplicateProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
