/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { classService } from "@/services/class.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, List, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import ClassForm from "./_components/ClassForm";
import { PaginationControls } from "@/components/shared/PaginationControls";

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classService.getAll(),
  });

  useEffect(() => {
    if (data?.success) setFilteredData(data.data);
  }, [data]);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 10,
    searchKeys: ["nama", "periodeNama"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => classService.deleteById(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Kelas dihapus.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
        <h3 className="font-bold flex items-center gap-2 text-gray-700"><List /> Manajemen Kelas</h3>
        <div className="flex gap-2">
          <Input placeholder="Cari..." className="w-48" onChange={(e) => setSearchQuery(e.target.value)} />
          <Button onClick={() => { setSelectedClass(null); setIsModalOpen(true); }} size="sm">
            <Plus size={16} className="mr-1" /> Tambah
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-16 text-center">NO</TableHead>
              <TableHead>NAMA KELAS</TableHead>
              <TableHead>PERIODE</TableHead>
              <TableHead className="text-center w-32">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item: any, idx: number) => (
              <TableRow key={item.id}>
                <TableCell className="text-center">{(currentPage - 1) * limit + idx + 1}</TableCell>
                <TableCell className="font-semibold text-indigo-700">{item.nama}</TableCell>
                <TableCell>{item.periodeNama}</TableCell>
                <TableCell className="flex justify-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setSelectedClass(item); setIsModalOpen(true); }}>
                    <Edit size={14} />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls {...pagination} />
      <ClassForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={selectedClass} />
    </div>
  );
}