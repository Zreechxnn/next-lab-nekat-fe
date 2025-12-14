/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { classService } from "@/services/class.service";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Edit, List, Plus, Trash } from "lucide-react";
import ClassForm from "./_components/ClassForm";

export default function ClassesPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const [filteredData, setFilteredData] = useState<any[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classService.getAll(),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const setFilteredDataEffect = async (data: any) => {
      setFilteredData(data.data);
    };

    if (data) {
      setFilteredDataEffect(data);
    }
  }, [data]);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["ruanganNama", "kelasNama"],
  });

  const {
    paginatedData,
    currentPage,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setSearchQuery,
  } = pagination;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => classService.deleteById(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Berhasil menghapus data kelas!");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data.message ||
            "Terjadi kesalahan saat menghapus member!"
        );
      }
    },
  });

  const createHandler = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const editHandler = (classData: any) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => deleteMutation.mutate(id);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <List />
            Daftar Kelas
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={createHandler}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
            >
              <Plus />
              Tambah Kelas
            </Button>
          </div>
        </div>

        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">NO</TableHead>
              <TableHead>NAMA KELAS</TableHead>
              <TableHead className="text-center" colSpan={2}>AKSI</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground"
                >
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item: any, idx: number) => {
                const hasOut =
                  item.timestampKeluar &&
                  item.timestampKeluar !== "0001-01-01T00:00:00";

                const isOut =
                  hasOut && item.timestampMasuk !== item.timestampKeluar;

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {(currentPage - 1) * limit + idx + 1}
                    </TableCell>

                    <TableCell>{item.nama}</TableCell>

                    <TableCell colSpan={2} className="text-center space-x-2">
                      <Button
                        variant={"outline"}
                        size="sm"
                        onClick={() => editHandler(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Apakah Anda Yakin?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Aksi ini tidak dapat dibatalkan. Data yang sudah
                              dihapus tidak akan bisa dikembalikan lagi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls {...pagination} />

      <ClassForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedClass}
      />
    </div>
  );
}
