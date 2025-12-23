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
import { useEffect, useState, useRef } from "react"; // Tambah useRef
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

// IMPORT SIGNALR
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";

export default function CardsPage() {
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null); // Ref untuk koneksi

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => cardService.getAll(),
    placeholderData: keepPreviousData,
  });

  // 1. Setup SignalR Effect
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    // Buat koneksi
    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          
          // PASTIKAN NAMA EVENT SAMA DENGAN DI BACKEND .NET (Hub)
          // Contoh: Jika backend mengirim "ReceiveCardUpdate" saat ada perubahan
          connection.on("ReceiveCardUpdate", () => {
            // Refresh data otomatis lewat React Query
            queryClient.invalidateQueries({ queryKey: ["cards"] });
            toast.info("Data kartu diperbarui real-time.");
          });

        } catch (e) {
          console.error("SignalR Error", e);
        }
      }
    };

    // Delay sedikit untuk memastikan mounting aman
    setTimeout(startSignalR, 1000);

    return () => {
      if (connection) connection.stop().catch(() => {});
    };
  }, [queryClient]);

  useEffect(() => {
    const setFilteredDataEffect = async (data: any) => {
      const rawData = data.data || data;
      setFilteredData(Array.isArray(rawData) ? rawData : []);
    };

    if (data) {
      setFilteredDataEffect(data);
    }
  }, [data]);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["uid", "userUsername", "kelasNama", "keterangan"],
  });

  const {
    paginatedData,
    currentPage,
    limit,
  } = pagination;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => cardService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Berhasil menghapus kartu!");
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data.message || "Terjadi kesalahan saat menghapus kartu!"
        );
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

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["cards"] });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ... (SISA KODE UI SAMA PERSIS SEPERTI SEBELUMNYA) ... */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <IdCard />
            Daftar Kartu RFID
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={createHandler}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
            >
              <Plus />
              Tambah Kartu
            </Button>
          </div>
        </div>

        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">NO</TableHead>
              <TableHead>UID KARTU</TableHead>
              <TableHead>PEMILIK</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>KETERANGAN</TableHead>
              <TableHead className="text-center" colSpan={2}>
                AKSI
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item: any, idx: number) => {
                const userName = item.userUsername;
                const className = item.kelasNama;

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {(currentPage - 1) * limit + idx + 1}
                    </TableCell>

                    <TableCell className="font-mono font-bold text-red-500 text-xs md:text-sm">
                      {item.uid ? item.uid.split(":").join(" : ") : "-"}
                    </TableCell>

                    <TableCell>
                      {userName ? (
                        <div className="flex items-center gap-2 text-blue-700 bg-blue-50 w-fit px-2 py-1 rounded-md text-xs font-medium">
                          <User size={12} /> {userName}
                        </div>
                      ) : className ? (
                        <div className="flex items-center gap-2 text-purple-700 bg-purple-50 w-fit px-2 py-1 rounded-md text-xs font-medium">
                          <Users size={12} /> {className}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                            border-0 font-medium
                            ${item.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${item.status === 'NONAKTIF' ? 'bg-gray-100 text-gray-600' : ''}
                            ${item.status === 'HILANG' ? 'bg-red-100 text-red-600' : ''}
                        `}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600">
                      {item.keterangan || "-"}
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
                              Aksi ini tidak dapat dibatalkan. Data kartu yang sudah
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

      <CardFormDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={selectedCard}
      />
    </div>
  );
}