/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { cardService } from "@/services/card.service";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { IdCard, Plus } from "lucide-react";
import CardFormDialog from "./_components/CardFormDialog";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { useSearchStore } from "@/store/useSearchStore";

// 1. IMPORT GUARD
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";

// IMPORT KOMPONEN BARU
import { CardCard } from "./_components/card-card";
import { CardTable } from "./_components/card-table";

export default function CardsPage() {
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Centralized Delete Logic
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: 0, uid: "" });

  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => cardService.getAll(),
    placeholderData: keepPreviousData,
  });

  // --- SignalR Logic (Tetap Dipertahankan) ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const connection = createSignalRConnection(token);
    connectionRef.current = connection;
    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          const refreshData = () => { queryClient.invalidateQueries({ queryKey: ["cards"] }); };
          connection.on("receivecardregistration", () => { refreshData(); toast.success("Kartu baru terdeteksi!"); });
          connection.on("kartudihapus", () => { refreshData(); toast.info("Kartu dihapus dari alat."); });
          connection.on("kartunotification", (msg) => { if (typeof msg === 'string') toast.info(msg); refreshData(); });
          connection.on("userstatuschanged", refreshData);
          connection.on("ReceiveCardUpdate", refreshData);
        } catch (e) { console.error("SignalR Error:", e); }
      }
    };
    const timer = setTimeout(startSignalR, 1000);
    return () => { clearTimeout(timer); if (connection) connection.stop().catch(() => {}); };
  }, [queryClient]);

  // --- Data Handling ---
  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery("");
  }, [setGlobalSearchQuery]);

  const pagination = useLocalPagination({
    initialData: data?.data || [],
    itemsPerPage: 15,
    searchKeys: ["uid", "userUsername", "kelasNama", "keterangan"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => cardService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Kartu dihapus.");
      setDeleteDialog({ open: false, id: 0, uid: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus.");
    },
  });

  // Handlers
  const openCreate = () => { setSelectedCard(null); setIsModalOpen(true); };
  const openEdit = (item: any) => { setSelectedCard(item); setIsModalOpen(true); };
  const openDelete = (id: number, uid: string) => { setDeleteDialog({ open: true, id, uid }); };

  return (
    // 2. BUNGKUS DENGAN GUARD (Admin & Operator)
    <RoleBasedGuard allowedRoles={["admin", "operator"]}>
      <div className="flex flex-col gap-6 font-sans pb-20">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <div className="bg-indigo-100 p-2 rounded-lg">
               <IdCard className="text-indigo-600" size={20} />
             </div>
             Daftar Kartu RFID
           </h3>
           <Button onClick={openCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 shadow-lg">
             <Plus size={18} className="mr-2" /> Tambah Kartu
           </Button>
        </div>

        <CardTable
          data={paginatedData}
          loading={isLoading}
          page={currentPage}
          limit={limit}
          onEdit={openEdit}
          onConfirmDelete={openDelete}
        />

        <div className="md:hidden space-y-3">
          {isLoading ? (
             <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
          ) : paginatedData.length === 0 ? (
             <div className="text-center py-10 text-gray-400 italic text-sm">Tidak ada data kartu.</div>
          ) : (
             paginatedData.map((item: any, index: number) => (
               <CardCard
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
        <CardFormDialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["cards"] })}
          initialData={selectedCard}
        />

        {/* Centralized Delete Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Hapus Kartu Permanen?</AlertDialogTitle>
              <AlertDialogDescription>
                Kartu dengan UID <span className="font-mono font-bold text-gray-800">{deleteDialog.uid}</span> akan dihapus dari database.
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