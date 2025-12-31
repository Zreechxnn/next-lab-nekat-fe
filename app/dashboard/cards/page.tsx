/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useLocalPagination } from "@/hooks/useLocalPagination";
import { cardService } from "@/services/card.service";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useState, useRef } from "react";
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
import { IdCard, Edit, Plus, Trash, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CardFormDialog from "./_components/CardFormDialog";

import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
// 1. Import Store
import { useSearchStore } from "@/store/useSearchStore";

export default function CardsPage() {
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // 2. State Global Search
  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => cardService.getAll(),
    placeholderData: keepPreviousData,
  });

  // SignalR Logic (Tetap sama)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const connection = createSignalRConnection(token);
    connectionRef.current = connection;
    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          const refreshData = () => {
             queryClient.invalidateQueries({ queryKey: ["cards"] });
          };
          connection.on("receivecardregistration", () => {
             refreshData();
             toast.success("Kartu baru berhasil didaftarkan via alat!");
          });
          connection.on("kartudihapus", () => {
             refreshData();
             toast.info("Data kartu telah dihapus.");
          });
          connection.on("kartunotification", (msg) => {
             if (typeof msg === 'string') toast.info(msg);
             refreshData();
          });
          connection.on("userstatuschanged", refreshData);
          connection.on("ReceiveCardUpdate", refreshData);
        } catch (e) {
          console.error("SignalR Connection Error:", e);
        }
      }
    };
    const timer = setTimeout(startSignalR, 1000);
    return () => {
      clearTimeout(timer);
      if (connection) connection.stop().catch(() => {});
    };
  }, [queryClient]);

  useEffect(() => {
    const setFilteredDataEffect = async (data: any) => {
      const rawData = data?.data || data;
      setFilteredData(Array.isArray(rawData) ? rawData : []);
    };
    if (data) setFilteredDataEffect(data);
  }, [data]);

  // 3. Reset Search saat mount
  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery("");
  }, [setGlobalSearchQuery]);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["uid", "userUsername", "kelasNama", "keterangan"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;

  // 4. Sinkronisasi Search
  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => cardService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Berhasil menghapus kartu!");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.message || "Terjadi kesalahan saat menghapus kartu!");
      }
    },
  });

  const createHandler = () => {
    setSelectedCard(null);
    setIsModalOpen(true);
  };

  const editHandler = (cardData: any) => {
    setSelectedCard(cardData);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => deleteMutation.mutate(id);
  const handleFormSuccess = () => queryClient.invalidateQueries({ queryKey: ["cards"] });

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Header Section */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <IdCard className="text-indigo-600" />
            Daftar Kartu RFID
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={createHandler}
              className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition flex items-center gap-2 shadow-sm"
            >
              <Plus size={16} />
              Tambah Kartu
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-16 text-center font-bold text-gray-600">NO</TableHead>
              <TableHead className="font-bold text-gray-600">UID KARTU</TableHead>
              <TableHead className="font-bold text-gray-600">PEMILIK</TableHead>
              <TableHead className="font-bold text-gray-600">STATUS</TableHead>
              <TableHead className="font-bold text-gray-600">KETERANGAN</TableHead>
              <TableHead className="text-center font-bold text-gray-600" colSpan={2}>
                AKSI
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground animate-pulse">
                  Sedang memuat data kartu...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Tidak ada data kartu ditemukan
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item: any, idx: number) => {
                const userName = item.userUsername;
                const className = item.kelasNama;

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50"
                  >
                    <TableCell className="text-center font-medium text-gray-500">
                      {(currentPage - 1) * limit + idx + 1}
                    </TableCell>

                    <TableCell className="font-mono font-bold text-indigo-600 text-xs md:text-sm tracking-wide">
                      {item.uid ? item.uid.split(":").join(" : ") : "-"}
                    </TableCell>

                    <TableCell>
                      {userName ? (
                        <div className="flex items-center gap-2 text-blue-700 bg-blue-50 w-fit px-2 py-1 rounded-md text-xs font-semibold border border-blue-100">
                          <User size={12} /> {userName}
                        </div>
                      ) : className ? (
                        <div className="flex items-center gap-2 text-purple-700 bg-purple-50 w-fit px-2 py-1 rounded-md text-xs font-semibold border border-purple-100">
                          <Users size={12} /> {className}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic flex items-center gap-1">
                           - Tidak Ada -
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                            border-0 font-bold px-2.5 py-0.5
                            ${item.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : ''}
                            ${item.status === 'NONAKTIF' ? 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' : ''}
                            ${item.status === 'BLOCKED' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : ''}
                            ${item.status === 'HILANG' ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' : ''}
                        `}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600 italic">
                      {item.keterangan || "-"}
                    </TableCell>

                    <TableCell colSpan={2} className="text-center">
                        <div className="flex justify-center items-center gap-2">
                            <Button
                                variant={"ghost"}
                                size="sm"
                                className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => editHandler(item)}
                            >
                                <Edit size={16} />
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash size={16} />
                                </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">
                                    Hapus Kartu Permanen?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Kartu dengan UID <span className="font-mono font-bold">{item.uid}</span> akan dihapus dari database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                    onClick={() => handleDelete(item.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                    Ya, Hapus
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls {...pagination} />

      <CardFormDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={selectedCard}
      />
    </div>
  );
}