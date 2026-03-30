import type { Metadata } from "next";
import "./globals.css";
import { SideNav } from "@/components/SideNav";
import { TopNav } from "@/components/TopNav";
import { TickerBar } from "@/components/TickerBar";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Deals Machine",
  description: "AI-powered lead gen + pipeline management for aviation charter brokers",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-on-background font-body min-h-screen">
        <ToastProvider>
          <TopNav />
          <SideNav />
          <div className="md:ml-64 pt-16">
            <TickerBar />
            <main className="px-4 md:px-8 py-8">
              <div className="animate-fadeSlideUp">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
