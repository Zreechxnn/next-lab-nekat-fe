/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { roomService } from "@/services/room.service";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Edit, FlaskConical, Plus, Trash } from "lucide-react";
import LabForm from "./_components/LabForm";
import { useSearchStore } from "@/store/useSearchStore"; // Import

export default function LabsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Global Search
  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["labs"],
    queryFn: () => roomService.getAll(),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (data?.data) setFilteredData(data.data);
  }, [data]);

  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery("");
  }, [setGlobalSearchQuery]);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["nama"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => roomService.deleteById(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      toast.success("Berhasil menghapus data lab!");
    },
    onError: (err) => {
      if (err instanceof AxiosError) toast.error(err.response?.data.message || "Terjadi kesalahan!");
    },
  });

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FlaskConical className="text-indigo-600" />
            Daftar Laboratorium
          </h3>
          {/* Search lokal dihapus */}
          <Button onClick={() => { setSelectedLab(null); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus size={16} className="mr-2" /> Tambah
          </Button>
        </div>

        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-16 text-center font-bold text-gray-600">NO</TableHead>
              <TableHead className="font-bold text-gray-600">NAMA LAB</TableHead>
              <TableHead className="text-center font-bold text-gray-600 w-32">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground animate-pulse">Sedang memuat data lab...</TableCell></TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">Tidak ada data lab ditemukan.</TableCell></TableRow>
            ) : (
              paginatedData.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50">
                  <TableCell className="text-center font-medium text-gray-500">{(currentPage - 1) * limit + idx + 1}</TableCell>
                  <TableCell><span className="font-semibold text-gray-800">{item.nama}</span></TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => { setSelectedLab(item); setIsModalOpen(true); }}><Edit size={16} /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"><Trash size={16} /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Lab?</AlertDialogTitle>
                          <AlertDialogDescription>Data lab <b>{item.nama}</b> akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(item.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
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
      <LabForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={selectedLab} />
    </div>
  );
}