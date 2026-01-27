"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import { useActivityFilter } from "@/hooks/useActivityFilter";
import { exportAktivitasToExcel } from "@/utils/exportActivity";
import { activityService } from "@/services/activity.service";
import { classService } from "@/services/class.service";
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
import { useQuery } from "@tanstack/react-query";

import { SelectBox, DateInput, StatusSelect } from "./_components/activity-filter-parts";
import { EditNoteDialog, ActivityStats } from "./_components/activity-form";
import { ActivityCard } from "./_components/activity-card";
import { ActivityTable } from "./_components/activity-table";

export default function ActivityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState({ open: false, id: 0, val: "" });
  const [userRole, setUserRole] = useState<string>(""); // State untuk menyimpan Role

  const globalSearchQuery = useSearchStore((state) => state.searchQuery);
  const setGlobalSearchQuery = useSearchStore((state) => state.setSearchQuery);

  const { data: classesData } = useQuery({
    queryKey: ["classes-filter"],
    queryFn: () => classService.getAll(),
    staleTime: 1000 * 60 * 5,
  });

  const { options, filters, handleFilterChange, filteredData, resetFilters } = useActivityFilter(data);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role || "");
        } catch (e) {
            console.error("Failed to parse token role", e);
        }
    }
  }, []);

  const isSiswa = userRole === "siswa";

  const classOptions = useMemo(() => {
    if (classesData?.success && classesData.data) {
        return classesData.data.map((c: any) => ({
            id: c.id,
            nama: c.nama,
            periodeNama: c.periodeNama
        }));
    }
    return options.kelas;
  }, [classesData, options.kelas]);

  const pagination = useLocalPagination({
    initialData: filteredData,
    itemsPerPage: 15,
    searchKeys: ["ruanganNama", "kelasNama", "userUsername", "userKelasNama", "kartuUid", "keterangan"],
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
          connection.on("AksesLogUpdated", fetchData);
          connection.on("AksesLogDeleted", fetchData);
          connection.on("AllAksesLogsDeleted", () => setData([]));
        } catch (e) { console.error("SignalR Error", e); }
      }
    };

    startSignalR();

    return () => {
      if (connection) {
        connection.stop().catch(() => {});
      }
    };
  }, []);

  const handleUpdateNote = async () => {
    if (isSiswa) return; 

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
    if (isSiswa) return; // Preventif delete untuk siswa
    if(!confirm("Hapus log ini?")) return;
    toast.loading("Menghapus...", { id: "delete" });
    try {
      const res = await activityService.deleteById(id);
      if (res.success) {
          setData((prev) => prev.filter((i) => i.id !== id));
          toast.success("Terhapus.");
      }
    } catch (e) { if (e instanceof AxiosError) toast.error(e.response?.data.message); } finally { toast.dismiss("delete"); }
  };

  const handleDeleteAll = async () => {
    if (isSiswa) return;
    const idsToDelete = filteredData.map((item: any) => item.id);
    if (idsToDelete.length === 0) return toast.error("Tidak ada data.");
    toast.loading("Proses hapus...", { id: "all" });
    try {
      if (filteredData.length !== data.length) {
        await Promise.all(idsToDelete.map((id: string) => activityService.deleteById(id)));
        setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
      } else {
        const res = await activityService.deleteAll();
        if (res.success) setData([]);
      }
      toast.success("Data berhasil dihapus.");
    } catch (e) { toast.error("Gagal."); } finally { toast.dismiss("all"); }
  };

  const stats = useMemo(() => {
    const total = filteredData.length;
    let active = 0;
    let totalMin = 0;
    let countOut = 0;
    const labs: Record<string, number> = {};

    filteredData.forEach((i: any) => {
      const hasOut = i.timestampKeluar && i.timestampKeluar !== "0001-01-01T00:00:00";
      if (!hasOut || i.timestampMasuk === i.timestampKeluar) active++;
      if (i.ruanganNama) labs[i.ruanganNama] = (labs[i.ruanganNama] || 0) + 1;

      const m = new Date(i.timestampMasuk).getTime();
      const k = new Date(i.timestampKeluar).getTime();
      if (hasOut && k > m) {
        totalMin += (k - m) / 60000;
        countOut++;
      }
    });

    const avg = countOut > 0 ? Math.round(totalMin / countOut) : 0;
    const popular = Object.entries(labs).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      total,
      active,
      avgDuration: avg > 60 ? `${Math.floor(avg / 60)}j ${avg % 60}m` : `${avg}m`,
      popularLab: popular
    };
  }, [filteredData]);

  return (
    <RoleBasedGuard allowedRoles={["admin", "operator", "guru", "siswa"]}>
      <div className="space-y-6 pb-20 font-sans bg-gray-50/50 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm mx-1 sm:mx-0">
          <h1 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Activity className="text-emerald-600" /> Log Aktivitas
          </h1>
          
          {!isSiswa && (
            <Button onClick={() => exportAktivitasToExcel(filteredData)} variant="outline" size="sm" className="w-full sm:w-auto gap-2 text-emerald-700 border-emerald-200">
                Excel <Download size={16} />
            </Button>
          )}

        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 mx-1 sm:mx-0">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm"><Filter size={16}/> Filter</h3>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7">
              <RotateCcw size={12} className="mr-1" /> Reset
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <SelectBox label="Lab" name="lab" val={filters.lab} fn={handleFilterChange} opts={options.labs} k="nama" />
            <SelectBox label="Kelas" name="kelas" val={filters.kelas} fn={handleFilterChange} opts={classOptions} k="nama" />
            <SelectBox label="User" name="user" val={filters.user} fn={handleFilterChange} opts={options.users} k="username" />
            <DateInput label="Mulai" name="startDate" val={filters.startDate} fn={handleFilterChange} />
            <DateInput label="Sampai" name="endDate" val={filters.endDate} fn={handleFilterChange} />
            <StatusSelect val={filters.status} fn={(v) => handleFilterChange({ target: { name: "status", value: v } })} />
          </div>
          <ActivityStats stats={stats} />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-bold text-gray-700 text-sm tracking-wide">DATA LOG ({filteredData.length})</h3>
             
             {!isSiswa && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 text-xs" disabled={filteredData.length === 0}>
                    Hapus Data <Trash size={12} className="ml-2"/>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                    <AlertDialogDescription>Tindakan ini menghapus data yang dipilih secara permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600">Ya, Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
             )}
          </div>

          <ActivityTable 
            data={paginatedData} 
            loading={loading} 
            page={currentPage} 
            limit={limit} 
            onEdit={(i) => setNoteDialog({open:true, id:i.id, val:i.keterangan||""})} 
            onDelete={handleDelete}
            isReadOnly={isSiswa} 
          />

          <div className="md:hidden space-y-3 px-1">
            {paginatedData.map((item: any) => (
              <ActivityCard 
                key={item.id} 
                item={item} 
                onEdit={(i) => setNoteDialog({open:true, id:i.id, val:i.keterangan||""})} 
                onDelete={handleDelete}
                isReadOnly={isSiswa}
              />
            ))}
          </div>
        </div>

        <PaginationControls {...pagination} />

        <EditNoteDialog 
            open={noteDialog.open} 
            onOpenChange={(o: boolean) => setNoteDialog({...noteDialog, open: o})} 
            value={noteDialog.val} 
            onChange={(v: string) => setNoteDialog({...noteDialog, val: v})} 
            onSave={handleUpdateNote} 
            isReadOnly={isSiswa}
        />
      </div>
    </RoleBasedGuard>
  );
}