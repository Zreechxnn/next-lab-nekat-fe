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
  Download,
  Trash,
  Pencil,
  Clock,
  ArrowRight
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Input } from "@/components/ui/input";

// Import komponen modular
import { SelectBox, DateInput, StatusSelect } from "./_components/activity-filter-parts";
import { EditNoteDialog, ActivityStats } from "./_components/activity-form";

export default function ActivityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState({ open: false, id: 0, val: "" });

  const { options, filters, handleFilterChange, filteredData } = useActivityFilter(data);

  // Pagination untuk tabel: 15 item per halaman agar pas di layar laptop
  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["ruanganNama", "kelasNama", "userUsername", "kartuUid", "keterangan"],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;
  const connectionRef = useRef<HubConnection | null>(null);

  // --- Helper: Hitung Durasi Realtime ---
  const calculateDuration = (start: string, end: string) => {
    if (!end || new Date(end).getFullYear() === 1 || start === end) return "Berjalan...";
    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}j ${mins}m`;
  };

  // --- Helper: Format Tanggal Ringkas ---
  const formatDateTime = (iso: string) => {
    if (!iso || iso.startsWith("0001")) return "-";
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
  };

  // --- Statistik Logic ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const active = filteredData.filter((i: any) => {
      const hasOut = i.timestampKeluar && i.timestampKeluar !== "0001-01-01T00:00:00";
      return !hasOut || i.timestampMasuk === i.timestampKeluar;
    }).length;

    let totalDurasi = 0;
    let countSelesai = 0;
    const labCounts: Record<string, number> = {};

    filteredData.forEach((i: any) => {
      const hasOut = i.timestampKeluar && i.timestampKeluar !== "0001-01-01T00:00:00";
      if (hasOut && i.timestampMasuk !== i.timestampKeluar) {
        totalDurasi += new Date(i.timestampKeluar).getTime() - new Date(i.timestampMasuk).getTime();
        countSelesai++;
      }
      const lab = i.ruanganNama || "Lainnya";
      labCounts[lab] = (labCounts[lab] || 0) + 1;
    });

    const avgDuration = countSelesai > 0
      ? (totalDurasi / countSelesai / 60000).toFixed(0) + " Menit"
      : "-";

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await activityService.getAll();
      if (res.success) {
        setData(res.data.sort((a: any, b: any) =>
          new Date(b.timestampMasuk).getTime() - new Date(a.timestampMasuk).getTime()
        ));
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
          connection.on("AllAksesLogsDeleted", () => {
            setData([]);
            toast.info("Database telah dibersihkan.");
          });
        } catch (e) {
          console.error("SignalR Error", e);
        }
      }
    };
    setTimeout(startSignalR, 1000);
    return () => { if (connection) connection.stop().catch(() => {}); };
  }, []);

  const handleUpdateNote = async () => {
    toast.loading("Menyimpan catatan...", { id: "note" });
    try {
      const res = await activityService.updateNote(noteDialog.id, noteDialog.val);
      if (res.success) {
        setData((prev) => prev.map((item) =>
          item.id === noteDialog.id ? { ...item, keterangan: noteDialog.val } : item
        ));
        toast.success("Catatan berhasil disimpan.");
        setNoteDialog({ open: false, id: 0, val: "" });
      }
    } catch (e) {
      toast.error("Gagal menyimpan catatan.");
    } finally {
      toast.dismiss("note");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Yakin ingin menghapus log aktivitas ini?")) return;
    
    toast.loading("Menghapus data...", { id: "delete" });
    try {
      const res = await activityService.deleteById(id);
      if (res.success) setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Data terhapus.");
    } catch (e) {
      if (e instanceof AxiosError) toast.error(e.response?.data.message);
    } finally {
      toast.dismiss("delete");
    }
  };

  const handleDeleteAll = async () => {
    toast.loading("Mereset database...", { id: "all" });
    try {
      const res = await activityService.deleteAll();
      if (res.success) {
        setData([]);
        toast.success("Semua data berhasil dihapus.");
      }
    } catch (e) {
      toast.error("Gagal mereset data.");
    } finally {
      toast.dismiss("all");
    }
  };

  return (
    <div className="space-y-6 pb-10 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <Activity /> Log Aktivitas Lab
        </h1>
        <div className="flex gap-2">
          {/* <Input
            placeholder="Cari User / Lab / Keterangan..."
            className="w-72 h-9 bg-gray-50 focus:bg-white transition-colors"
            onChange={(e) => setSearchQuery(e.target.value)}
          /> */}
          <Button onClick={() => exportAktivitasToExcel(filteredData)} variant="outline" size="sm" className="gap-2 text-green-700 border-green-200 hover:bg-green-50">
            Excel <Download size={16} />
          </Button>
        </div>
      </div>

      {/* Filter & Stats Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SelectBox label="Lab" name="lab" val={filters.lab} fn={handleFilterChange} opts={options.labs} k="nama" />
          <SelectBox label="Kelas" name="kelas" val={filters.kelas} fn={handleFilterChange} opts={options.kelas} k="nama" />
          <SelectBox label="User" name="user" val={filters.user} fn={handleFilterChange} opts={options.users} k="username" />
          <DateInput label="Mulai" name="startDate" val={filters.startDate} fn={handleFilterChange} />
          <DateInput label="Sampai" name="endDate" val={filters.endDate} fn={handleFilterChange} />
          <StatusSelect val={filters.status} fn={(v) => handleFilterChange({ target: { name: "status", value: v } })} />
        </div>
        <ActivityStats stats={stats} />
      </div>

      {/* Modern Table Section */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50/50">
           <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Data Akses Terkini</h3>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-8" disabled={data.length === 0}>
                 Reset Semua Log <Trash size={12} className="ml-2"/>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Seluruh Data?</AlertDialogTitle>
                <AlertDialogDescription>Tindakan ini akan menghapus semua riwayat akses secara permanen.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">Ya, Hapus Semua</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Table>
          <TableHeader className="bg-gray-100/80">
            <TableRow>
              <TableHead className="w-[50px] text-center font-bold text-gray-600">No</TableHead>
              <TableHead className="w-[220px] font-bold text-gray-600">Identitas Pengguna</TableHead>
              <TableHead className="font-bold text-gray-600">Lab / Ruangan</TableHead>
              <TableHead className="font-bold text-gray-600">Waktu Akses</TableHead>
              <TableHead className="font-bold text-gray-600">Durasi</TableHead>
              <TableHead className="font-bold text-gray-600">Status</TableHead>
              <TableHead className="w-[250px] font-bold text-gray-600">Keterangan</TableHead>
              <TableHead className="w-[50px] text-right font-bold text-gray-600">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">Sedang memuat data...</TableCell></TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-400 italic">Belum ada aktivitas terekam.</TableCell></TableRow>
            ) : paginatedData.map((item: any, idx: number) => {
               const isCheckOut = item.timestampKeluar && new Date(item.timestampKeluar).getFullYear() !== 1 && item.timestampMasuk !== item.timestampKeluar;
               
               return (
                <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <TableCell className="text-center text-gray-500 font-mono text-xs">
                    {(currentPage - 1) * limit + idx + 1}
                  </TableCell>
                  
                  {/* Kolom Identitas: Nama di atas, UID di bawah */}
                  <TableCell>
                    <div className="flex flex-col justify-center">
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[180px]" title={item.userUsername ?? item.kelasNama}>
                        {item.userUsername ?? item.kelasNama ?? "Unknown"}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded border">
                          {item.kartuUid}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-gray-700 font-medium text-sm">
                    {item.ruanganNama}
                  </TableCell>
                  
                  {/* Kolom Waktu: Stacked dengan panah indikator */}
                  <TableCell>
                     <div className="flex flex-col text-xs gap-1">
                        <span className="flex items-center gap-1.5 text-green-700 font-medium">
                           <ArrowRight size={12} className="text-green-500" /> {formatDateTime(item.timestampMasuk)}
                        </span>
                        {isCheckOut && (
                          <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                             <ArrowRight size={12} className="text-red-400" /> {formatDateTime(item.timestampKeluar)}
                          </span>
                        )}
                     </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 w-fit px-2.5 py-1 rounded-full border border-indigo-100">
                       <Clock size={12} />
                       {calculateDuration(item.timestampMasuk, item.timestampKeluar)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={isCheckOut ? "secondary" : "default"} className={`text-[10px] px-2 py-0.5 shadow-none ${isCheckOut ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'}`}>
                       {isCheckOut ? "SELESAI" : "AKTIF"}
                    </Badge>
                  </TableCell>
                  
                  {/* Kolom Keterangan: Truncate + Edit Button on Hover */}
                  <TableCell className="align-middle">
                    <div className="flex items-center justify-between gap-2 group/note relative h-full">
                      <div className="text-sm text-gray-600 truncate max-w-[200px]" title={item.keterangan}>
                        {item.keterangan || <span className="text-gray-300 italic text-xs font-light">Tidak ada catatan</span>}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover/note:opacity-100 transition-opacity text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 absolute right-0 bg-white/80 backdrop-blur-sm"
                        onClick={() => setNoteDialog({ open: true, id: item.id, val: item.keterangan || "" })}
                        title="Edit Keterangan"
                      >
                        <Pencil size={12} />
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
                      onClick={() => handleDelete(item.id)}
                      title="Hapus Baris Ini"
                    >
                      <Trash size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PaginationControls {...pagination} />

      <EditNoteDialog
        open={noteDialog.open}
        onOpenChange={(o: boolean) => setNoteDialog({...noteDialog, open: o})}
        value={noteDialog.val}
        onChange={(v: string) => setNoteDialog({...noteDialog, val: v})}
        onSave={handleUpdateNote}
      />
    </div>
  );
}