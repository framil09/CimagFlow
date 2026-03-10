"use client";

import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data: session } = useSession() ?? {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userName = (session?.user as any)?.name ?? "";
  const userRole = (session?.user as any)?.role ?? "";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar userName={mounted ? userName : ""} userRole={mounted ? userRole : ""} />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <Sidebar userName={mounted ? userName : ""} userRole={mounted ? userRole : ""} />
          </div>
          <button
            className="absolute top-4 right-4 text-white z-10"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px]">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button
            className="md:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
