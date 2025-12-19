/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { userService } from "@/services/user.service";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import UserForm from "./_components/UserForm";

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [filteredData, setFilteredData] = useState<any[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getAll(),
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
    searchKeys: ["username", "role"],
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
    mutationFn: async (id: number) => userService.deleteById(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Berhasil menghapus data user!");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data.message ||
            "Terjadi kesalahan saat menghapus user!"
        );
      }
    },
  });

  const createHandler = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const editHandler = (userData: any) => {
    setSelectedUser(userData);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => deleteMutation.mutate(id);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <List />
            Daftar User
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={createHandler}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
            >
              <Plus />
              Tambah User
            </Button>
          </div>
        </div>

        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">NO</TableHead>
              <TableHead>USERNAME</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead className="text-center" colSpan={2}>AKSI</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item: any, idx: number) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {(currentPage - 1) * limit + idx + 1}
                  </TableCell>

                  <TableCell className="font-semibold">{item.username}</TableCell>

                  <TableCell>
                    <span className="inline-flex items-center justify-center min-w-[80px] rounded-md px-3 py-1.5 text-xs font-bold text-white bg-blue-500">
                      {item.role}
                    </span>
                  </TableCell>

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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls {...pagination} />

      <UserForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedUser}
      />
    </div>
  );
}