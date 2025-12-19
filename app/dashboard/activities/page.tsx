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
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Input } from "@/components/ui/input";

// Import komponen modular yang telah kita pisahkan
import { SelectBox, DateInput, StatusSelect } from "./_components/activity-filter-parts";
import { EditNoteDialog, ActivityStats } from "./_components/activity-form";

export default function ActivityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState({ open: false, id: 0, val: "" });

  const { options, filters, handleFilterChange, filteredData } = useActivityFilter(data);

  // Perbaikan Error: Menambahkan searchKeys yang diwajibkan oleh useLocalPagination
  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["ruanganNama", "kelasNama", "userUsername", "kartuUid", "keterangan"],
  });

  const {
    paginatedData,
    currentPage,
    limit,
    setSearchQuery,
  } = pagination;

  const connectionRef = useRef<HubConnection | null>(null);

  // --- Kalkulasi Statistik ---
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
            toast.info("Semua riwayat aktivitas telah dibersihkan.");
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
    toast.loading("Memperbarui catatan...", { id: "note" });
    try {
      const res = await activityService.updateNote(noteDialog.id, noteDialog.val);
      if (res.success) {
        setData((prev) => prev.map((item) => 
          item.id === noteDialog.id ? { ...item, keterangan: noteDialog.val } : item
        ));
        toast.success("Catatan diperbarui.");
        setNoteDialog({ open: false, id: 0, val: "" });
      }
    } catch (e) {
      toast.error("Gagal memperbarui catatan.");
    } finally {
      toast.dismiss("note");
    }
  };

  const handleDelete = async (id: string) => {
    toast.loading("Menghapus data...", { id: "delete" });
    try {
      const res = await activityService.deleteById(id);
      if (res.success) setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Berhasil menghapus data.");
    } catch (e) {
      if (e instanceof AxiosError) toast.error(e.response?.data.message || "Gagal menghapus.");
    } finally {
      toast.dismiss("delete");
    }
  };

  const handleDeleteAll = async () => {
    toast.loading("Menghapus semua...", { id: "all" });
    try {
      const res = await activityService.deleteAll();
      if (res.success) {
        setData([]);
        toast.success("Semua data dihapus.");
      }
    } catch (e) {
      toast.error("Gagal menghapus semua data.");
    } finally {
      toast.dismiss("all");
    }
  };

  const formatTime = (iso: any) =>
    !iso || iso.startsWith("0001") ? "-" : new Date(iso).toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });

  return (
    <div className="space-y-6 pb-10 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <Activity /> Aktivitas Lab
        </h1>
        <div className="flex gap-2">
          <Input 
            placeholder="Cari data..." 
            className="w-64 h-9" 
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={() => exportAktivitasToExcel(filteredData)} variant="outline" size="sm" className="gap-2">
            Export <Download size={16} />
          </Button>
        </div>
      </div>

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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Riwayat Akses</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={data.length === 0} className="gap-2">
                Hapus Semua <Trash size={14} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">Hapus Seluruh Data?</AlertDialogTitle>
                <AlertDialogDescription>Tindakan ini permanen dan menghapus semua log akses di database.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600">Ya, Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">NO</TableHead>
              <TableHead>KARTU</TableHead>
              <TableHead>LAB</TableHead>
              <TableHead>USER/KELAS</TableHead>
              <TableHead>MASUK</TableHead>
              <TableHead>KELUAR</TableHead>
              <TableHead>KETERANGAN</TableHead>
              <TableHead className="text-center">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10">Memuat...</TableCell></TableRow>
            ) : paginatedData.map((item: any, idx: number) => (
              <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="text-center">{(currentPage - 1) * limit + idx + 1}</TableCell>
                <TableCell className="font-mono text-xs text-red-500 font-bold">{item.kartuUid?.replace(/:/g, " : ")}</TableCell>
                <TableCell className="font-semibold">{item.ruanganNama}</TableCell>
                <TableCell className="text-muted-foreground">{item.userUsername ?? item.kelasNama ?? "-"}</TableCell>
                <TableCell className="text-xs">{formatTime(item.timestampMasuk)}</TableCell>
                <TableCell className="text-xs">{formatTime(item.timestampKeluar)}</TableCell>
                <TableCell className="text-sm italic text-gray-500">{item.keterangan || "-"}</TableCell>
                <TableCell className="text-center flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setNoteDialog({ open: true, id: item.id, val: item.keterangan || "" })}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                    <Trash size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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