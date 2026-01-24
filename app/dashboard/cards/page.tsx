/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { cardService } from "@/services/card.service";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";
import { CardCard } from "./_components/card-card";
import { CardTable } from "./_components/card-table";

export default function CardsPage() {
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: 0, uid: "" });

  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => cardService.getAll(),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          const refresh = () => queryClient.invalidateQueries({ queryKey: ["cards"] });

          connection.on("kartunotification", (msg) => {
            if (typeof msg === 'string') toast.info(msg);
            refresh();
          });

          connection.on("kartudiperbarui", () => {
            refresh();
            toast.success("Data kartu diperbarui!");
          });

          connection.on("receivecardregistration", () => {
            refresh();
            toast.success("Kartu baru terdeteksi!");
          });

          connection.on("kartudihapus", () => {
            refresh();
            toast.warning("Kartu dihapus.");
          });

        } catch (e) { console.error("SignalR Error:", e); }
      }
    };

    const timer = setTimeout(startSignalR, 1000);
    return () => {
      clearTimeout(timer);
      if (connection) {
        connection.off("kartunotification");
        connection.off("kartudiperbarui");
        connection.off("receivecardregistration");
        connection.stop().catch(() => {});
      }
    };
  }, [queryClient]);

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
    mutationFn: (id: number) => cardService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Kartu dihapus.");
      setDeleteDialog({ open: false, id: 0, uid: "" });
    },
  });

  return (
    <RoleBasedGuard allowedRoles={["admin", "operator"]}>
      <div className="flex flex-col gap-6 font-sans pb-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <div className="bg-indigo-100 p-2 rounded-lg"><IdCard className="text-indigo-600" size={20} /></div>
             Daftar Kartu RFID
           </h3>
           <Button onClick={() => { setSelectedCard(null); setIsModalOpen(true); }} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
             <Plus size={18} className="mr-2" /> Tambah Kartu
           </Button>
        </div>

        <CardTable data={paginatedData} loading={isLoading} page={currentPage} limit={limit} onEdit={(item) => { setSelectedCard(item); setIsModalOpen(true); }} onConfirmDelete={(id, uid) => setDeleteDialog({ open: true, id, uid })} />

        <div className="md:hidden space-y-3">
          {paginatedData.map((item: any, index: number) => (
            <CardCard key={item.id} item={item} index={(currentPage - 1) * limit + index} onEdit={(item) => { setSelectedCard(item); setIsModalOpen(true); }} onConfirmDelete={(id, uid) => setDeleteDialog({ open: true, id, uid })} />
          ))}
        </div>

        <PaginationControls {...pagination} />

        <CardFormDialog open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["cards"] })} initialData={selectedCard} />

        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Hapus Kartu?</AlertDialogTitle>
              <AlertDialogDescription>Kartu UID <span className="font-bold">{deleteDialog.uid}</span> akan dihapus permanen.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate(deleteDialog.id)} className="bg-red-600">Ya, Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleBasedGuard>
  );
}