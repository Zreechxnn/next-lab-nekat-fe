"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { ChevronDown, Menu, Search, User, LogOut, Lock, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChangePasswordDialog from "./Changepassword-dialog";

export default function Header({ onClick }: { onClick: () => void }) {
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <header className="flex sticky top-8 border border-gray-200 backdrop-blur-3xl shadow-sm bg-white/90 rounded-2xl p-3 z-50 justify-between items-center mb-8">
        <Button
          variant={"outline"}
          className="flex items-center md:hidden justify-center mr-2 w-8 gap-0"
          onClick={onClick}
        >
          <Menu className="text-black" />
        </Button>

        <div className="bg-white px-5 py-2.5 rounded-full shadow-sm w-full md:w-[400px] flex items-center">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="border-none outline-none ml-4 w-full text-sm bg-transparent"
          />
        </div>

        <div className="flex items-center gap-5 relative" ref={dropdownRef}>
          <div 
            className="flex group items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <div className="hidden md:block text-right">
                <span className="text-sm font-medium block leading-none">
                {user?.username ?? "Loading..."}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                    {user?.role ?? "User"}
                </span>
            </div>
            <ChevronDown 
                size={16} 
                className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} 
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 py-3 border-b border-gray-100 mb-2 md:hidden">
                 <p className="font-semibold text-gray-800">{user?.username}</p>
                 <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>

              <div className="space-y-1">
                <button 
                    onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/dashboard/my-profile'); 
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                    <Settings size={16} className="text-gray-500" />
                    Detail Profil
                </button>

                <button 
                    onClick={() => {
                        setIsDropdownOpen(false);
                        setIsPasswordDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                    <Lock size={16} className="text-gray-500" />
                    Ganti Password
                </button>
                
                <div className="h-px bg-gray-100 my-1" />
                
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left font-medium">
                    <LogOut size={16} />
                    Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <ChangePasswordDialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen} 
      />
    </>
  );
}