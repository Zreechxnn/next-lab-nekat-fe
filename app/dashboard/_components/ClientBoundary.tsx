"use client";

import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import { useState } from "react";

export default function ClientBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  return (
    <div className="min-h-screen relative bg-[#fbfbfb]">
      <Sidebar
        isOpenSidebar={isOpenSidebar}
        setIsOpenSidebar={setIsOpenSidebar}
      />

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out md:ml-[280px]">
        
        <header className="sticky top-0 z-20 w-full bg-[#fbfbfb]/90 backdrop-blur-sm border-b border-gray-100">
          <Header onClick={() => setIsOpenSidebar(!isOpenSidebar)} />
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {isOpenSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpenSidebar(false)}
        />
      )}
    </div>
  );
}