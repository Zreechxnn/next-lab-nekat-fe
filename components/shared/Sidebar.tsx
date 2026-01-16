"use client";

import { useAuthStore } from "@/store/useAuthStore";
import {
  Activity,
  Book,
  FlaskConical,
  IdCard,
  LayoutDashboard,
  Users,
  X,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { cn } from "@/lib/utils";

// 1. Tambahkan properti allowedRoles
interface MenuItem {
  href: string;
  label: string;
  icon: any;
  allowedRoles: string[]; // Array role yang diizinkan
}

export default function Sidebar({
  isOpenSidebar,
  setIsOpenSidebar,
}: {
  isOpenSidebar: boolean;
  setIsOpenSidebar: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const isDesktop = useIsDesktop();

  const handleLogout = () => {
    logout();
    router.push("/");
    if (!isDesktop) setIsOpenSidebar(false);
  };

  // 2. Konfigurasi Menu dengan Role sesuai Backend
  const menuItems: MenuItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      allowedRoles: ["admin", "operator", "guru", "siswa"]
    },
    {
      href: "/dashboard/activities",
      label: "Aktivitas Lab",
      icon: Activity,
      // PERBAIKAN: Pisahkan string dengan koma di luar kutip
      allowedRoles: ["admin", "operator", "guru", "siswa"] 
    },
    {
      href: "/dashboard/classes",
      label: "Data Kelas",
      icon: Book,
      // PERBAIKAN: Hapus spasi berlebih dan pisahkan string
      allowedRoles: ["admin", "guru", "operator"]
    },
    {
      href: "/dashboard/labs",
      label: "Data Lab",
      icon: FlaskConical,
      allowedRoles: ["admin", "operator"]
    },
    { 
      href: "/dashboard/cards", 
      label: "Data Kartu", 
      icon: IdCard,
      allowedRoles: ["admin", "operator"] 
    },
    { 
      href: "/dashboard/users", 
      label: "Data User", 
      icon: Users,
      allowedRoles: ["admin"] 
    },
  ];

  // 3. Filter Menu Berdasarkan Role User saat ini
  const filteredMenu = menuItems.filter((item) => {
    // Jika user belum load atau tidak punya role, sembunyikan menu (kecuali dashboard umum jika perlu)
    if (!user || !user.role) return false;
    
    // Cek apakah role user ada di allowedRoles item tersebut
    // Kita gunakan toLowerCase() untuk jaga-jaga konsistensi string
    return item.allowedRoles.includes(user.role.toLowerCase());
  });

  return (
    <>
      {/* OVERLAY – MOBILE */}
      <AnimatePresence>
        {!isDesktop && isOpenSidebar && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpenSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : isOpenSidebar ? 0 : -300,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="
          fixed top-4 left-4 z-50
          h-[calc(100vh-2rem)]
          w-[260px]
          bg-white
          rounded-3xl
          shadow-xl
          flex flex-col
          border border-gray-100
        "
      >
        {/* CLOSE – MOBILE */}
        {!isDesktop && (
          <button
            onClick={() => setIsOpenSidebar(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* HEADER */}
        <div className="px-6 pt-6 pb-4 text-center shrink-0">
          <Image
            src="/img/smkn1katapang.webp"
            alt="Logo"
            width={80}
            height={80}
            className="mx-auto mb-3"
          />
          <h3 className="text-sm font-bold tracking-wide text-gray-800">
            SISTEM AKSES LAB
          </h3>
          <p className="text-xs text-gray-400">SMKN 1 Katapang</p>
          
          {/* Badge Role User (Opsional, untuk info visual) */}
          {user?.role && (
            <div className="mt-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-emerald-100 text-emerald-800 uppercase">
              {user.role}
            </div>
          )}
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {pathname === "/dashboard/my-profile" ? (
              <li>
                <Link
                  href={"/dashboard"}
                  onClick={() => !isDesktop && setIsOpenSidebar(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all"
                  )}
                >
                  <ArrowLeft className={cn("w-5 h-5 transition-colors")} />
                  <span className="truncate">Kembali ke dashboard</span>
                </Link>
              </li>
            ) : (
              <>
                {/* Render Menu yang sudah difilter */}
                {filteredMenu.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => !isDesktop && setIsOpenSidebar(false)}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                          isActive
                            ? "bg-emerald-100 text-emerald-800 shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5 transition-colors",
                            isActive
                              ? "text-emerald-700"
                              : "text-gray-400 group-hover:text-gray-600"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        </nav>

        <div className="pt-4 mt-4 mb-2 border-t border-gray-100 text-center text-[11px] text-gray-400">
          <p>© {new Date().getFullYear()} SMKN 1 Katapang</p>
          <p className="mt-0.5">Build v1.0.0</p>
        </div>
      </motion.aside>
    </>
  );
}