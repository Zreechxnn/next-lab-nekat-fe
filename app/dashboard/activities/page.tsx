/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { useActivityFilter } from "@/hooks/useActivityFilter";
import { exportAktivitasToExcel } from "@/utils/exportActivity";
import { activityService } from "@/services/activity.service";
import { classService } from "@/services/class.service"; // IMPORT CLASS SERVICE
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Activity, Download, Trash, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { PaginationControls } from "@/components/shared/PaginationControls";
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";
import { useSearchStore } from "@/store/useSearchStore";
import { useQuery } from "@tanstack/react-query"; // IMPORT USEQUERY

// IMPORT KOMPONEN
import { SelectBox, DateInput, StatusSelect } from "./_components/activity-filter-parts";
import { EditNoteDialog, ActivityStats } from "./_components/activity-form";
import { ActivityCard } from "./_components/activity-card";
import { ActivityTable } from "./_components/activity-table";

export default function ActivityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState({ open: false, id: 0, val: "" });

  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  // Ambil Data Master Kelas untuk Filter Dropdown
  const { data: classesData } = useQuery({
    queryKey: ["classes-filter"],
    queryFn: () => classService.getAll(),
    staleTime: 1000 * 60 * 5, // Cache 5 menit
  });

  const { options, filters, handleFilterChange, filteredData } = useActivityFilter(data);

  // Gabungkan Opsi Kelas: Prioritaskan dari Master Data agar ada Nama Periodenya
  const classOptions = useMemo(() => {
    if (classesData?.success && classesData.data) {
        return classesData.data.map((c: any) => ({
            id: c.id,
            nama: c.nama,
            periodeNama: c.periodeNama // Pastikan backend kirim ini di getAll Kelas
        }));
    }
    return options.kelas; // Fallback (biasanya kosong dr hook)
  }, [classesData, options.kelas]);


  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: [
      "ruanganNama", 
      "kelasNama",      
      "userUsername", 
      "userKelasNama",  // Agar search text juga mencari kelas siswa
      "kartuUid", 
      "keterangan"
    ],
  });

  const { paginatedData, currentPage, limit, setSearchQuery } = pagination;
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    setGlobalSearchQuery("");
    return () => setGlobalSearchQuery("");
  }, [setGlobalSearchQuery]);

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  const handleResetFilters = () => {
    setGlobalSearchQuery("");
    ["lab", "kelas", "user", "status", "startDate", "endDate"].forEach((key) => {
      handleFilterChange({ target: { name: key, value: "" } });
    });
    toast.info("Filter di-reset");
  };

  // --- Logic Statistik ---
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

    const avgDuration = countSelesai > 0 ? (totalDurasi / countSelesai / 60000).toFixed(0) + "m" : "-";
    let popularLab = "-";
    let maxCount = 0;
    Object.entries(labCounts).forEach(([lab, count]) => {
      if (count > maxCount) { maxCount = count; popularLab = lab; }
    });

    return { total, active, avgDuration, popularLab };
  }, [filteredData]);

  // --- Fetching Logic ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await activityService.getAll();
      if (res.success) {
        setData(res.data.sort((a: any, b: any) => new Date(b.timestampMasuk).getTime() - new Date(a.timestampMasuk).getTime()));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
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
          connection.on("AllAksesLogsDeleted", () => { setData([]); toast.info("Database dibersihkan."); });
        } catch (e) { console.error("SignalR Error", e); }
      }
    };
    setTimeout(startSignalR, 1000);
    return () => { if (connection) connection.stop().catch(() => {}); };
  }, []);

  // --- Handlers (Update Note, Delete, DeleteAll) ---
  const handleUpdateNote = async () => {
    toast.loading("Menyimpan...", { id: "note" });
    try {
      const res = await activityService.updateNote(noteDialog.id, noteDialog.val);
      if (res.success) {
        setData((prev) => prev.map((item) => item.id === noteDialog.id ? { ...item, keterangan: noteDialog.val } : item));
        toast.success("Berhasil.");
        setNoteDialog({ open: false, id: 0, val: "" });
      }
    } catch (e) { toast.error("Gagal."); } finally { toast.dismiss("note"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus log ini?")) return;
    toast.loading("Menghapus...", { id: "delete" });
    try {
      const res = await activityService.deleteById(id);
      if (res.success) setData((prev) => prev.filter((i) => i.id !== id));
      toast.success("Terhapus.");
    } catch (e) { if (e instanceof AxiosError) toast.error(e.response?.data.message); } finally { toast.dismiss("delete"); }
  };

  const handleDeleteAll = async () => {
    const idsToDelete = filteredData.map((item: any) => item.id);
    if (idsToDelete.length === 0) return toast.error("Tidak ada data.");
    const isFiltered = filteredData.length !== data.length;
    toast.loading("Proses hapus...", { id: "all" });

    try {
      if (isFiltered) {
        await Promise.all(idsToDelete.map((id: string) => activityService.deleteById(id)));
        setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
        toast.success(`${idsToDelete.length} data dihapus.`);
      } else {
        const res = await activityService.deleteAll();
        if (res.success) { setData([]); toast.success("Semua data dihapus."); }
      }
    } catch (e) { toast.error("Gagal sebagian."); } finally { toast.dismiss("all"); }
  };

  const openEdit = (item: any) => setNoteDialog({ open: true, id: item.id, val: item.keterangan || "" });

  return (
    <RoleBasedGuard allowedRoles={["admin", "operator", "guru,siswa"]}>
      <div className="space-y-6 pb-20 font-sans bg-gray-50/50 min-h-screen">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm mx-1 sm:mx-0">
          <h1 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Activity className="text-emerald-600" /> Log Aktivitas
          </h1>
          <Button onClick={() => exportAktivitasToExcel(filteredData)} variant="outline" size="sm" className="w-full sm:w-auto gap-2 text-emerald-700 border-emerald-200">
            Excel <Download size={16} />
          </Button>
        </div>

        {/* Filter & Stats */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 mx-1 sm:mx-0">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm"><Filter size={16}/> Filter</h3>
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-7">
              <RotateCcw size={12} className="mr-1" /> Reset
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <SelectBox label="Lab" name="lab" val={filters.lab} fn={handleFilterChange} opts={options.labs} k="nama" />
            
            {/* GUNAKAN classOptions YANG DIAMBIL DARI MASTER DATA */}
            <SelectBox label="Kelas" name="kelas" val={filters.kelas} fn={handleFilterChange} opts={classOptions} k="nama" />
            
            <SelectBox label="User" name="user" val={filters.user} fn={handleFilterChange} opts={options.users} k="username" />
            <DateInput label="Mulai" name="startDate" val={filters.startDate} fn={handleFilterChange} />
            <DateInput label="Sampai" name="endDate" val={filters.endDate} fn={handleFilterChange} />
            <StatusSelect val={filters.status} fn={(v) => handleFilterChange({ target: { name: "status", value: v } })} />
          </div>
          <ActivityStats stats={stats} />
        </div>

        {/* Data Container */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-bold text-gray-700 text-sm tracking-wide">DATA LOG ({filteredData.length})</h3>

             {/* Delete All Dialog */}
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 text-xs" disabled={filteredData.length === 0}>
                  {filteredData.length !== data.length ? `Hapus ${filteredData.length} Item` : "Hapus Semua"} <Trash size={12} className="ml-2"/>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                  <AlertDialogDescription>Tindakan ini menghapus {filteredData.length} data secara permanen.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600">Ya, Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
             </AlertDialog>
          </div>

          <ActivityTable
            data={paginatedData} loading={loading} page={currentPage} limit={limit}
            onEdit={openEdit} onDelete={handleDelete}
          />

          <div className="md:hidden space-y-3 px-1">
             {loading ? <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div> :
              paginatedData.length === 0 ? <div className="text-center py-10 text-gray-400 italic text-sm">Tidak ada data.</div> :
              paginatedData.map((item: any) => (
                <ActivityCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
              ))
             }
          </div>
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
    </RoleBasedGuard>
  );
}