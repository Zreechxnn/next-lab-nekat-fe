"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { ChevronDown, LogOut, Menu, Search, User } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Header({ onClick }: { onClick: () => void }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpenProfileDropdown, setIsOpenProfileDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header
      className={`
        flex sticky top-0 z-50 p-3 rounded-2xl items-center mb-8 transition-all duration-300
        ${pathname !== "/dashboard/my-profile" ? "justify-between" : "justify-end"}
        ${
          isScrolled
            ? "bg-white/40 backdrop-blur-md border border-white/20 shadow-sm" // Saat Scroll: Glass Effect (Semi Transparan + Blur)
            : "bg-white border border-gray-200 shadow-sm" // Saat di Atas: Solid Putih
        }
      `}
    >
      <Button
        variant={"outline"}
        className="flex items-center md:hidden justify-center mr-2 w-8 gap-0"
        onClick={onClick}
      >
        <Menu className="text-black" />
      </Button>

      {pathname === "/dashboard" && (
        <h1 className={`ml-2 text-xl font-semibold transition-colors ${isScrolled ? "text-gray-900" : "text-gray-800"}`}>
          Selamat datang, {user?.username}!
        </h1>
      )}

      {pathname !== "/dashboard" && pathname !== "/dashboard/my-profile" && (
        <div className={`
          px-5 py-2.5 rounded-full shadow-sm w-full md:w-[400px] flex items-center border
          transition-all duration-300
          ${isScrolled ? "bg-white/60 border-white/40" : "bg-white border-gray-100"}
        `}>
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="border-none outline-none ml-4 w-full text-sm bg-transparent"
          />
        </div>
      )}

      <DropdownMenu
        open={isOpenProfileDropdown}
        onOpenChange={setIsOpenProfileDropdown}
      >
        <DropdownMenuTrigger asChild>
          <button
            className={`
              flex items-center gap-3 px-3 py-2
              rounded-full border
              transition-all duration-150
              ${
                isOpenProfileDropdown || !isScrolled
                  ? "bg-white border-gray-200 shadow-sm hover:bg-gray-50"
                  : "bg-white/60 border-white/40 shadow-sm hover:bg-white/80" // Tombol profile juga menyesuaikan glass
              }
            `}
          >
            <div className="relative">
              <i className="far fa-bell text-gray-500 text-sm"></i>
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
            </div>

            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>

            <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[120px] truncate">
              {user?.username ?? "Loading..."}
            </span>

            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isOpenProfileDropdown ? "rotate-180" : ""
              }`}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={12}
          className="w-64 rounded-xl border border-gray-200 bg-white shadow-lg p-1"
        >
          <div className="px-3 py-2 mb-1 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.username}
            </p>
          </div>

          <DropdownMenuGroup>
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
              onClick={() => router.push("/dashboard/my-profile")}
            >
              <User className="w-4 h-4 text-gray-600" />
              Profil Saya
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <div className="my-1 h-px bg-gray-100" />

          <DropdownMenuItem
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}