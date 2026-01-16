/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { classService } from "@/services/class.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Book, Plus } from "lucide-react";
import ClassForm from "./_components/ClassForm";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { useSearchStore } from "@/store/useSearchStore";
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";

// IMPORT KOMPONEN BARU
import { ClassCard } from "./_components/class-card";
import { ClassTable } from "./_components/class-table";

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // State untuk Dialog Hapus (Clean Approach)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: "", nama: "" });

  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classService.getAll(),
  });

  // Reset search saat masuk halaman
  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery("");
  }, [setGlobalSearchQuery]);

  const pagination = useLocalPagination({
    initialData: data?.success ? data.data : [],
    itemsPerPage: 10,
    searchKeys: ["nama", "periodeNama"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Kelas berhasil dihapus.");
      setDeleteDialog({ open: false, id: "", nama: "" });
    },
    onError: () => toast.error("Gagal menghapus kelas.")
  });

  // Handler Buka Form
  const openCreate = () => { setSelectedClass(null); setIsFormOpen(true); };
  const openEdit = (item: any) => { setSelectedClass(item); setIsFormOpen(true); };
  
  // Handler Buka Delete Konfirmasi
  const openDelete = (id: string, nama: string) => { 
      setDeleteDialog({ open: true, id, nama }); 
  };

  return (
    // PERBAIKAN: RoleBasedGuard membungkus seluruh konten div
    <RoleBasedGuard allowedRoles={["admin", "guru", "operator"]}>
      <div className="flex flex-col gap-6 font-sans pb-20">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Book className="text-indigo-600" size={20} />
            </div>
            Manajemen Kelas
          </h3>
          <Button onClick={openCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 shadow-lg">
            <Plus size={18} className="mr-2" /> Tambah Kelas
          </Button>
        </div>

        {/* --- CONTENT AREA --- */}
        
        {/* Desktop View */}
        <ClassTable 
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
            <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic text-sm">Tidak ada data.</div>
          ) : (
            paginatedData.map((item: any, index: number) => (
              <ClassCard 
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
        <ClassForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          initialData={selectedClass} 
        />

        {/* Delete Dialog (Global) */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan menghapus kelas <b>{deleteDialog.nama}</b>. Tindakan ini tidak dapat dibatalkan.
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