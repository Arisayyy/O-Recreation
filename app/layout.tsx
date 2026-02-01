import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/app/components/navbar";
import { ReplicateProvider } from "@/app/components/replicate-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const siteTitle = "Not Orchid";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
      noarchive: true,
    },
  },
  openGraph: {
    type: "website",
    title: siteTitle,
    siteName: siteTitle,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    images: ["/twitter-image"],
  },
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
