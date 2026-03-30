"use client";
import AuthGate from "./AuthGate";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import TickerBar from "./TickerBar";
import BottomNav from "./BottomNav";
import TagOverlay from "./TagOverlay";

export default function AppShell({ children }) {
  return (
    <AuthGate>
      <Sidebar />
      <TopNav />
      <TickerBar />
      <TagOverlay />
      <main className="md:ml-16 pt-[84px] pb-20 md:pb-12 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </AuthGate>
  );
}
