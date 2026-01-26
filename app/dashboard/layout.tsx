"use client";

import { useState } from "react";
import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import { SignalRProvider } from "@/providers/SignalRProvider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SignalRProvider>
        <Sidebar isOpenSidebar={isOpenSidebar} setIsOpenSidebar={setIsOpenSidebar} />
        <div className="md:ml-[276px] transition-all duration-300 px-6 pt-8">
          <Header onClick={() => setIsOpenSidebar(!isOpenSidebar)} />
          <main className="max-w-7xl mx-auto">{children}</main>
        </div>
      </SignalRProvider>
    </div>
  );
}