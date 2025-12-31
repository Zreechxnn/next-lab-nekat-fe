/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { classService } from "@/services/class.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Book, Edit, Plus, Trash } from "lucide-react";
import ClassForm from "./_components/ClassForm";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { useSearchStore } from "@/store/useSearchStore"; // Import Store

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Mengambil state search dari Header
  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classService.getAll(),
  });

  useEffect(() => {
    if (data?.success) setFilteredData(data.data);
  }, [data]);

  // Reset search header saat masuk halaman ini
  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery(""); // Reset saat keluar
  }, [setGlobalSearchQuery]);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 10,
    searchKeys: ["nama", "periodeNama"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  // Sinkronisasi: Header ketik -> Pagination filter
  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => classService.deleteById(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Kelas berhasil dihapus.");
    },
  });

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Book className="text-indigo-600" />
            Manajemen Kelas
          </h3>
          {/* Input Search Lokal SUDAH DIHAPUS disini */}
          <Button
            onClick={() => { setSelectedClass(null); setIsModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus size={16} className="mr-2" /> Tambah
          </Button>
        </div>

        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-16 text-center font-bold text-gray-600">NO</TableHead>
              <TableHead className="font-bold text-gray-600">NAMA KELAS</TableHead>
              <TableHead className="font-bold text-gray-600">PERIODE</TableHead>
              <TableHead className="text-center font-bold text-gray-600 w-32">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground animate-pulse">Sedang memuat data kelas...</TableCell></TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Tidak ada data kelas ditemukan.</TableCell></TableRow>
            ) : (
              paginatedData.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50">
                  <TableCell className="text-center font-medium text-gray-500">{(currentPage - 1) * limit + idx + 1}</TableCell>
                  <TableCell><span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded text-sm">{item.nama}</span></TableCell>
                  <TableCell className="text-gray-600">{item.periodeNama}</TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => { setSelectedClass(item); setIsModalOpen(true); }}><Edit size={16} /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"><Trash size={16} /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
                          <AlertDialogDescription>Data kelas <b>{item.nama}</b> akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(item.id)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls {...pagination} />
      <ClassForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={selectedClass} />
    </div>
  );
}