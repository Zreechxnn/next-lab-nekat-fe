/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { roomService } from "@/services/room.service";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { FlaskConical, Plus } from "lucide-react";
import LabForm from "./_components/LabForm";
import { useSearchStore } from "@/store/useSearchStore";
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";

import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";

import { LabCard } from "./_components/lab-card";
import { LabTable } from "./_components/lab-table";

export default function LabsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: "", nama: "" });

  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["labs"],
    queryFn: () => roomService.getAll(),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery("");
  }, [setGlobalSearchQuery]);

  const pagination = useLocalPagination({
    initialData: data?.data || [],
    itemsPerPage: 10,
    searchKeys: ["nama"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();

          const refresh = () => queryClient.invalidateQueries({ queryKey: ["labs"] });

          // Perbaikan nama event menjadi lowercase sesuai log backend
          connection.on("ruangannotification", (payload: any) => {
            console.log("Realtime Lab:", payload);
            
            if (typeof payload === "string") {
              toast.info(payload);
            } else if (payload?.eventType || payload?.EventType) {
              const type = payload.eventType || payload.EventType;
              if (type === "RUANGAN_CREATED") toast.success("Lab baru ditambahkan");
              if (type === "RUANGAN_DELETED") toast.warning("Lab telah dihapus");
            }
            
            refresh();
          });

          // Listener tambahan untuk konsistensi antar halaman
          connection.on("kartunotification", refresh);
          connection.on("kartudiperbarui", refresh);

        } catch (e) {
          console.error("SignalR Error", e);
        }
      }
    };

    const timer = setTimeout(startSignalR, 1000);

    return () => {
      clearTimeout(timer);
      if (connection) {
        connection.off("ruangannotification");
        connection.off("kartunotification");
        connection.off("kartudiperbarui");
        connection.stop().catch(() => {});
      }
    };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => roomService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      toast.success("Lab berhasil dihapus!");
      setDeleteDialog({ open: false, id: "", nama: "" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus lab.");
    },
  });

  const openCreate = () => { setSelectedLab(null); setIsFormOpen(true); };
  const openEdit = (item: any) => { setSelectedLab(item); setIsFormOpen(true); };
  const openDelete = (id: string, nama: string) => { setDeleteDialog({ open: true, id, nama }); };

  return (
    <RoleBasedGuard allowedRoles={["admin", "guru", "operator"]}>
      <div className="flex flex-col gap-6 font-sans pb-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FlaskConical className="text-indigo-600" size={20} />
              </div>
              Daftar Laboratorium
          </h3>
          <Button onClick={openCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 shadow-lg">
            <Plus size={18} className="mr-2" /> Tambah Lab
          </Button>
        </div>

        <LabTable data={paginatedData} loading={isLoading} page={currentPage} limit={limit} onEdit={openEdit} onConfirmDelete={openDelete} />

        <div className="md:hidden space-y-3">
          {isLoading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
          ) : paginatedData.length === 0 ? (
              <div className="text-center py-10 text-gray-400 italic text-sm">Tidak ada data lab.</div>
          ) : (
              paginatedData.map((item: any, index: number) => (
                <LabCard key={item.id} item={item} index={(currentPage - 1) * limit + index} onEdit={openEdit} onConfirmDelete={openDelete} />
              ))
          )}
        </div>

        <PaginationControls {...pagination} />

        <LabForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={selectedLab} />

        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Laboratorium?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus <b>{deleteDialog.nama}</b>? Data yang dihapus tidak dapat dikembalikan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate(deleteDialog.id)} className="bg-red-600 text-white">
                {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleBasedGuard>
  );
}