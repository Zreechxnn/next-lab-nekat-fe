/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { userService } from "@/services/user.service";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react"; // Tambah useRef
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

// IMPORT GUARD
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";

// IMPORT SIGNALR
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";

// IMPORT KOMPONEN BARU
import { UserCard } from "./_components/user-card";
import { UserTable } from "./_components/user-table";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Ref untuk koneksi SignalR
  const connectionRef = useRef<HubConnection | null>(null);

  // State untuk Dialog Hapus (Centralized)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: 0, username: "" });

  // Global Search
  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

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

  const pagination = useLocalPagination({
    initialData: data?.data || [],
    itemsPerPage: 15,
    searchKeys: ["username", "role"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  // --- INTEGRASI SIGNALR (Realtime Update) ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();

          // Dengarkan event "UserNotification" dari Backend
          connection.on("UserNotification", (payload: any) => {
            console.log("Realtime User:", payload);

            // Notifikasi Toast
            if (payload.EventType === "USER_CREATED") toast.info(`Info: User baru '${payload.Data.username}' ditambahkan`);
            if (payload.EventType === "USER_DELETED") toast.warning(`Info: User '${payload.Data.username}' telah dihapus`);
            
            // Refresh Data Tabel secara otomatis
            queryClient.invalidateQueries({ queryKey: ["users"] });
          });

        } catch (e) {
          console.error("SignalR Error", e);
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
      toast.success("User berhasil dihapus!");
      setDeleteDialog({ open: false, id: 0, username: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus user.");
    },
  });

  // Handlers
  const openCreate = () => { setSelectedUser(null); setIsFormOpen(true); };
  const openEdit = (item: any) => { setSelectedUser(item); setIsFormOpen(true); };
  const openDelete = (id: number, username: string) => { setDeleteDialog({ open: true, id, username }); };

  return (
    // BUNGKUS DENGAN GUARD (Hanya Admin)
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

        {/* Desktop View (Table) */}
        <UserTable
          data={paginatedData}
          loading={isLoading}
          page={currentPage}
          limit={limit}
          onEdit={openEdit}
          onConfirmDelete={openDelete}
        />

        {/* Mobile View (Card) */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
             <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
          ) : paginatedData.length === 0 ? (
             <div className="text-center py-10 text-gray-400 italic text-sm">Tidak ada data user.</div>
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

        {/* Form Dialog */}
        <UserForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedUser}
        />

        {/* Delete Dialog (Global) */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus User?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus user <b>{deleteDialog.username}</b>? Tindakan ini tidak dapat dibatalkan.
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