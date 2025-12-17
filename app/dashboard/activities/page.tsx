/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { useActivityFilter } from "@/hooks/useActivityFilter";
import { exportAktivitasToExcel } from "@/utils/exportActivity";
import { activityService } from "@/services/activity.service";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Activity,
  ChartPie,
  Check,
  Clock,
  DoorOpen,
  Download,
  Trash,
} from "lucide-react";
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
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { PaginationControls } from "@/components/shared/PaginationControls";

export default function ActivityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook Filter
  const { options, filters, handleFilterChange, filteredData } =
    useActivityFilter(data);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["ruanganNama", "kelasNama"],
  });

  const {
    paginatedData,
    currentPage,
    limit,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    totalItems,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    totalPages,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasNextPage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasPrevPage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    goToPage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nextPage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prevPage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setSearchQuery,
  } = pagination;

  const connectionRef = useRef<HubConnection | null>(null);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const active = filteredData.filter((i: any) => {
      const hasOut =
        i.timestampKeluar && i.timestampKeluar !== "0001-01-01T00:00:00";
      return !hasOut || i.timestampMasuk === i.timestampKeluar;
    }).length;

    let totalDurasi = 0;
    let countSelesai = 0;
    const labCounts: Record<string, number> = {};

    filteredData.forEach((i: any) => {
      const hasOut =
        i.timestampKeluar && i.timestampKeluar !== "0001-01-01T00:00:00";
      if (hasOut && i.timestampMasuk !== i.timestampKeluar) {
        totalDurasi +=
          new Date(i.timestampKeluar).getTime() -
          new Date(i.timestampMasuk).getTime();
        countSelesai++;
      }
      const lab = i.ruanganNama || "Lainnya";
      labCounts[lab] = (labCounts[lab] || 0) + 1;
    });

    const avgDuration =
      countSelesai > 0
        ? (totalDurasi / countSelesai / 60000).toFixed(0) + " Menit"
        : "0 Menit";

    let popularLab = "-";
    let maxCount = 0;
    Object.entries(labCounts).forEach(([lab, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularLab = lab;
      }
    });

    return { total, active, avgDuration, popularLab };
  }, [filteredData]);

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await activityService.getAll();
      if (res.success) {
        setData(
          res.data.sort(
            (a: any, b: any) =>
              new Date(b.timestampMasuk).getTime() -
              new Date(a.timestampMasuk).getTime()
          )
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          connection.on("ReceiveCheckIn", fetchData);
          connection.on("ReceiveCheckOut", fetchData);

          // LISTENER BARU: Jika admin lain menghapus semua data
          connection.on("AllAksesLogsDeleted", () => {
            setData([]);
            toast.info("Semua riwayat aktivitas telah dibersihkan oleh sistem.");
          });
        } catch (e) {
          console.error("SignalR Error", e);
        }
      }
    };
    setTimeout(startSignalR, 1000);
    return () => {
      if (connection) connection.stop().catch(() => {});
    };
  }, []);

  // const handleRefresh = () => fetchData();

  const handleDelete = async (id: string) => {
    toast.loading("Menghapus data...", { id: "delete" });
    try {
      const res = await activityService.deleteById(id);
      if (res.success) setData((prev) => prev.filter((i) => i.id !== id));

      toast.success("Berhasil menghapus data.");
    } catch (e) {
      if (e instanceof AxiosError) {
        toast.error(
          e.response?.data.message || "Terjadi kesalahan saat menghapus data."
        );
        console.error(e);
      }
    } finally {
      toast.dismiss("delete");
    }
  };

  // --- HANDLER DELETE ALL ---
  const handleDeleteAll = async () => {
    toast.loading("Menghapus semua data...", { id: "delete-all" });
    try {
      const res = await activityService.deleteAll();
      if (res.success) {
        setData([]); // Langsung kosongkan data lokal
        toast.success("Semua data aktivitas berhasil dihapus.");
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        toast.error(
          e.response?.data.message || "Gagal menghapus semua data."
        );
        console.error(e);
      }
    } finally {
      toast.dismiss("delete-all");
    }
  };

  const handleExportClick = () => {
    exportAktivitasToExcel(filteredData);
  };

  // Helper UI
  const formatTime = (iso: any) =>
    !iso
      ? "-"
      : new Date(iso).toLocaleString("id-ID", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

  const getDuration = (start: any, end: any) => {
    const dEnd = new Date(end);
    if (!end || start === end || dEnd.getFullYear() === 1) return "-";
    const diff = Math.floor(
      (dEnd.getTime() - new Date(start).getTime()) / 60000
    );
    return diff < 60
      ? `${diff} Menit`
      : `${Math.floor(diff / 60)} Jam ${diff % 60} Menit`;
  };

  return (
    <div className="space-y-6 pb-10 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-gray-700 bg-white px-5 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <Activity />
          Aktivitas Lab
        </h1>
      </div>

      {/* Filter & Stats Container */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SelectBox
            label="Lab"
            name="lab"
            val={filters.lab}
            fn={handleFilterChange}
            opts={options.labs}
            k="nama"
          />
          <SelectBox
            label="Kelas"
            name="kelas"
            val={filters.kelas}
            fn={handleFilterChange}
            opts={options.kelas}
            k="nama"
          />
          <SelectBox
            label="User"
            name="user"
            val={filters.user}
            fn={handleFilterChange}
            opts={options.users}
            k="username"
          />

          <DateInput
            label="Tanggal Mulai"
            name="startDate"
            val={filters.startDate}
            fn={handleFilterChange}
          />
          <DateInput
            label="Tanggal Sampai"
            name="endDate"
            val={filters.endDate}
            fn={handleFilterChange}
          />

          <div className="flex flex-col">
            <Label
              htmlFor="status"
              className="text-sm font-bold text-gray-800 mb-1"
            >
              Status
            </Label>
            <div className="relative">
              <Select
                name="status"
                value={filters.status}
                onValueChange={handleFilterChange}
              >
                <SelectTrigger className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 appearance-none bg-white text-gray-600 font-medium h-[38px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined!}>Semua Status</SelectItem>
                  <SelectItem value="CHECKIN">Check In</SelectItem>
                  <SelectItem value="CHECKOUT">Check Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Aktivitas"
            val={stats.total}
            bg="bg-blue-400"
            Icon={Check}
          />
          <StatCard
            title="Sedang Aktif"
            val={stats.active}
            bg="bg-orange-300"
            Icon={DoorOpen}
          />
          <StatCard
            title="Waktu Durasi"
            val={stats.avgDuration}
            bg="bg-purple-400"
            Icon={Clock}
          />
          <StatCard
            title="Lab Terpopuler"
            val={stats.popularLab}
            bg="bg-pink-400"
            Icon={ChartPie}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-list-ul text-gray-600"></i> Daftar Aktivitas
            Lab
          </h3>
          <div className="flex gap-2">
            {/* TOMBOL DELETE ALL */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2"
                  disabled={data.length === 0}
                >
                  Hapus Semua <Trash className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">
                    PERINGATAN KERAS!
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus <b>SELURUH RIWAYAT AKTIVITAS</b>?
                    <br />
                    <br />
                    Tindakan ini akan menghapus semua data log akses dari
                    database secara permanen. Data yang hilang tidak dapat
                    dikembalikan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Ya, Hapus Semuanya
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={handleExportClick}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
            >
              Export excel <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">NO</TableHead>
              <TableHead>KARTU ID</TableHead>
              <TableHead>LAB</TableHead>
              <TableHead>KELAS / USER</TableHead>
              <TableHead>WAKTU MASUK</TableHead>
              <TableHead>WAKTU KELUAR</TableHead>
              <TableHead>DURASI</TableHead>
              <TableHead className="text-center">STATUS</TableHead>
              <TableHead className="text-center">AKSI</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
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

                    <TableCell className="font-mono font-bold text-red-500 text-xs md:text-sm">
                      {item.kartuUid
                        ? item.kartuUid.split(":").join(" : ")
                        : "-"}
                    </TableCell>

                    <TableCell className="font-semibold">
                      {item.ruanganNama}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {item.userUsername ?? item.kelasNama ?? "-"}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs md:text-sm">
                      {formatTime(item.timestampMasuk)}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs md:text-sm">
                      {hasOut ? formatTime(item.timestampKeluar) : "-"}
                    </TableCell>

                    <TableCell className="font-medium text-xs md:text-sm">
                      {getDuration(item.timestampMasuk, item.timestampKeluar)}
                    </TableCell>

                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[100px] rounded-md px-3 py-1.5 text-xs font-bold text-white ${
                          isOut ? "bg-emerald-500" : "bg-blue-500"
                        }`}
                      >
                        {isOut ? "CHECK OUT" : "CHECK IN"}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
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
    </div>
  );
}

// --- Reusable Components ---
interface Option {
  id: string | number;
  [key: string]: any;
}

interface SelectBoxProps {
  label: string;
  name: string;
  val: string;
  fn: (e: any) => void;
  opts: Option[];
  k: string;
}

export function SelectBox({ label, name, val, fn, opts, k }: SelectBoxProps) {
  const handleValueChange = (newValue: string) => {
    fn({
      target: {
        name: name,
        value: newValue,
      },
    });
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor={name} className="text-sm font-bold text-gray-800">
        {label}
      </Label>

      <Select value={val} onValueChange={handleValueChange} name={name}>
        <SelectTrigger
          id={name}
          className="w-full text-sm h-[38px] border-gray-300 focus:ring-indigo-500"
        >
          <SelectValue placeholder={`Semua ${label}`} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={undefined!} className="text-gray-500">
            Semua {label}
          </SelectItem>

          {opts.map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {o[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DateInput({ label, name, val, fn }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-bold text-gray-800 mb-1">{label}</label>
      <input
        type="date"
        name={name}
        value={val}
        onChange={fn}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white text-gray-600 font-medium h-[38px]"
      />
    </div>
  );
}
function StatCard({ title, val, bg, Icon }: any) {
  return (
    <div
      className={`${bg} rounded-xl p-5 flex items-center gap-4 text-white shadow-md min-h-[100px]`}
    >
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <Icon size={32} />
      </div>
      <div>
        <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
        <p className="text-lg md:text-xl white font-bold leading-none break-all">
          {val}
        </p>
      </div>
    </div>
  );
}