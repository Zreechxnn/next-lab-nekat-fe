/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { roomService } from "@/services/room.service";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

// IMPORT KOMPONEN BARU
import { LabCard } from "./_components/lab-card";
import { LabTable } from "./_components/lab-table";

export default function LabsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  
  // State untuk Dialog Hapus (Centralized)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: "", nama: "" });

  // Global Search
  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["labs"],
    queryFn: () => roomService.getAll(),
    placeholderData: keepPreviousData,
  });

  // Reset Search Header
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

  // Handlers
  const openCreate = () => { setSelectedLab(null); setIsFormOpen(true); };
  const openEdit = (item: any) => { setSelectedLab(item); setIsFormOpen(true); };
  const openDelete = (id: string, nama: string) => { setDeleteDialog({ open: true, id, nama }); };

  return (
    <div className="flex flex-col gap-6 font-sans pb-20">
      
      {/* Header Section */}
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

      {/* --- CONTENT AREA --- */}

      {/* Desktop View (Table) */}
      <LabTable 
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
           <div className="text-center py-10 text-gray-400 italic text-sm">Tidak ada data lab.</div>
        ) : (
           paginatedData.map((item: any, index: number) => (
             <LabCard 
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
      <LabForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={selectedLab} 
      />

      {/* Delete Dialog (Global) */}
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
  );
}