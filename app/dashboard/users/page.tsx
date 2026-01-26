/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { userService } from "@/services/user.service";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Users, Plus } from "lucide-react";
import UserForm from "./_components/UserForm";
import { useSearchStore } from "@/store/useSearchStore";
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { UserCard } from "./_components/user-card";
import { UserTable } from "./_components/user-table";
import { useAuthStore } from "@/store/useAuthStore"; // Import auth store

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Ref untuk koneksi SignalR
  const connectionRef = useRef<HubConnection | null>(null);

  // State untuk Dialog Hapus
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: 0, username: "" });

  // Global Search
  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  // Query Data Users
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getAll(),
    placeholderData: keepPreviousData,
  });

  // Reset Search Header saat mount
  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery("");
  }, [setGlobalSearchQuery]);

  // Pagination Logic
  const pagination = useLocalPagination({
    initialData: data?.data || [],
    itemsPerPage: 15,
    searchKeys: ["username", "role"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  // --- INTEGRASI SIGNALR (PENYELARASAN REALITAS) ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const refreshTable = (reason: string) => {
        console.log(`🔄 Realitas diperbarui karena: ${reason}`);
        queryClient.invalidateQueries({ queryKey: ["users"] });
    };

    // Handler Universal untuk menormalisasi persepsi event
    const handleNotification = (payload: any) => {
        // Normalisasi casing: eventType, EventType, atau type
        const rawType = payload.eventType || payload.EventType || payload.type || "";
        const eventType = rawType.toUpperCase(); // Memaksakan keseragaman bentuk
        const data = payload.data || payload.Data;

        console.log("⚡ SignalR Diterima (Users Page):", eventType, data);

        // **PERBAIKAN PENTING**: Update global auth store jika user yang diupdate adalah user yang sedang login
        if (eventType === "USER_UPDATED") {
          const currentUser = useAuthStore.getState().user;
          if (currentUser && data && data.id === currentUser.id) {
            // Update user di global store
            useAuthStore.getState().updateUser({
              username: data.username,
              role: data.role,
              kelasId: data.kelasId,
              kelasNama: data.kelasNama,
              kartuUid: data.kartuUid,
              kartuId: data.kartuId,
            });
            
            // Notifikasi untuk user yang sedang login
            if (data.username && data.username !== currentUser.username) {
              toast.info(`Username anda berubah menjadi: ${data.username}`);
            }
            if (data.role && data.role !== currentUser.role) {
              toast.info(`Role anda berubah menjadi: ${data.role}`);
            }
          }
        }

        // Menerima eksistensi event: CREATED, DELETED, atau UPDATED
        if (["USER_CREATED", "USER_DELETED", "USER_UPDATED"].includes(eventType)) {

            if (eventType === "USER_CREATED") toast.info(`Entitas baru lahir: ${data.username}`);
            if (eventType === "USER_DELETED") toast.warning(`Entitas tiada: ${data.username}`);

            refreshTable(eventType);
        }
    };

    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          console.log("✅ Kesadaran SignalR Terhubung (Users Page)");

          // LISTENER GANDA (Dualitas Persepsi)
          // Mendengarkan kedua kemungkinan nama metode untuk menangkap kebenaran mutlak
          connection.on("UserNotification", handleNotification);   // PascalCase
          connection.on("usernotification", handleNotification);   // lowercase

          // Listener Status Tambahan
          connection.on("userstatuschanged", () => refreshTable("StatusChanged"));
          connection.on("UserStatusChanged", () => refreshTable("StatusChanged"));

          // Meredam kebisingan check-in
          connection.on("receivecheckin", () => {});
          connection.on("ReceiveCheckIn", () => {});

        } catch (e) {
          console.error("Kegagalan Koneksi Eksistensial", e);
        }
      }
    };

    startSignalR();

    return () => {
      if (connection) connection.stop().catch(() => {});
    };
  }, [queryClient]);
  // -------------------------------------------

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => userService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Eksistensi user berhasil dihapus!");
      setDeleteDialog({ open: false, id: 0, username: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus entitas.");
    },
  });

  // Handlers
  const openCreate = () => { setSelectedUser(null); setIsFormOpen(true); };
  const openEdit = (item: any) => { setSelectedUser(item); setIsFormOpen(true); };
  const openDelete = (id: number, username: string) => { setDeleteDialog({ open: true, id, username }); };

  return (
    <RoleBasedGuard allowedRoles={["admin"]}>
      <div className="flex flex-col gap-6 font-sans pb-20">

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <div className="bg-indigo-100 p-2 rounded-lg">
               <Users className="text-indigo-600" size={20} />
             </div>
             Daftar Pengguna
          </h3>
          <Button onClick={openCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 shadow-lg">
            <Plus size={18} className="mr-2" /> Tambah User
          </Button>
        </div>

        {/* --- CONTENT AREA --- */}

        {/* Desktop View */}
        <UserTable
          data={paginatedData}
          loading={isLoading}
          page={currentPage}
          limit={limit}
          onEdit={openEdit}
          onConfirmDelete={openDelete}
        />

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
             <div className="text-center py-10 text-gray-400 text-sm">Menunggu manifestasi data...</div>
          ) : paginatedData.length === 0 ? (
             <div className="text-center py-10 text-gray-400 italic text-sm">Kekosongan data terdeteksi.</div>
          ) : (
             paginatedData.map((item: any, index: number) => (
               <UserCard
                 key={item.id}
                 item={item}
                 index={(currentPage - 1) * limit + index}
                 onEdit={openEdit}
                 onConfirmDelete={openDelete}
               />
             ))
          )}
        </div>

        <PaginationControls {...pagination} />

        <UserForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedUser}
        />

        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Eksistensi?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus user <b>{deleteDialog.username}</b>? Tindakan ini akan mengembalikan data ke ketiadaan (void).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deleteDialog.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </RoleBasedGuard>
  );
}