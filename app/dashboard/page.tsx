/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import AccessChart from "@/components/shared/AccessChart";
import { dashboardService } from "@/services/dashboard.service";
import AuthGuard from "@/components/shared/AuthGuard";
import RoleBasedGuard from "@/components/shared/RoleBasedGuard";
import { Check, Clock, DoorOpen, FlaskConical, LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRuangan: 0,
    aktifSekarang: 0,
    totalKelas: 0,
    totalAkses: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("monthly");

  const isMounted = useRef(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const router = useRouter();

  const getAuthToken = () => localStorage.getItem("authToken");

  const fetchStats = async () => {
    try {
      const res = await dashboardService.overviewStats();
      if (res.success && isMounted.current) {
        const d = res.data;
        setStats({
          totalRuangan: d.totalRuangan ?? d.TotalRuangan ?? 0,
          aktifSekarang: d.aktifSekarang ?? d.AktifSekarang ?? 0,
          totalKelas: d.totalKelas ?? d.TotalKelas ?? 0,
          totalAkses: d.totalAkses ?? d.TotalAkses ?? 0,
        });
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  const fetchChartData = async (mode: string) => {
    try {
      const res = mode === "monthly"
        ? await dashboardService.monthlyStats()
        : await dashboardService.last30DayStats();

      if (res.success && isMounted.current) {
        const formattedData = res.data.map((item: any) => ({
          name: mode === "monthly" ? item.bulan : item.tanggal,
          value: item.total,
        }));
        setChartData(formattedData);
      }
    } catch (err) {
      console.error("Chart load error:", err);
    }
  };

  useEffect(() => {
    if (isMounted.current) fetchChartData(chartMode);
  }, [chartMode]);

  useEffect(() => {
    isMounted.current = true;
    const token = getAuthToken();
    
    // Pindahkan logika redirect token kosong ke AuthGuard,
    // tapi tetap aman jika ada di sini sebagai double check.
    if (!token) {
      // Tidak perlu router.push disini karena AuthGuard akan menanganinya
      return; 
    }

    fetchStats();
    fetchChartData("monthly");

    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();

          if ((connection.state as unknown as HubConnectionState) === HubConnectionState.Connected) {
            await connection.invoke("JoinDashboard");
          }

          const refreshAll = () => {
            fetchStats();
            fetchChartData(chartMode);
          };

          const silence = () => {};
          connection.on("userstatuschanged", silence);
          connection.on("UserStatusChanged", silence);

          connection.on("DashboardStatsUpdated", (payload: any) => {
            if (isMounted.current) {
              const s = payload.stats || payload.Stats || payload;
              setStats({
                totalRuangan: s.totalRuangan ?? s.TotalRuangan ?? 0,
                aktifSekarang: s.aktifSekarang ?? s.AktifSekarang ?? 0,
                totalKelas: s.totalKelas ?? s.TotalKelas ?? 0,
                totalAkses: s.totalAkses ?? s.TotalAkses ?? 0,
              });
            }
          });

          connection.on("ruangannotification", refreshAll);
          connection.on("RuanganNotification", refreshAll);
          connection.on("KelasChanged", refreshAll);
          connection.on("kelaschanged", refreshAll);
          connection.on("ReceiveCheckIn", refreshAll);
          connection.on("ReceiveCheckOut", refreshAll);
          connection.on("UpdateDashboard", refreshAll);
        }
      } catch (e) {
        console.error("SignalR Dashboard Error:", e);
      }
    };

    setTimeout(startSignalR, 500);

    return () => {
      isMounted.current = false;
      if (connectionRef.current) {
        connectionRef.current.off("DashboardStatsUpdated");
        connectionRef.current.off("userstatuschanged");
        connectionRef.current.off("UserStatusChanged");
        connectionRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    // PERUBAHAN UTAMA: AuthGuard di LUAR, RoleBasedGuard di DALAM
    <AuthGuard>
      <RoleBasedGuard allowedRoles={["admin", "operator", "guru", "siswa"]}>
        <div className="font-sans space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h1 className="text-xl font-bold text-gray-700 flex items-center gap-2">
              <LayoutDashboard className="text-emerald-600" /> Dashboard
            </h1>
            <div className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-2 notranslate" translate="no">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Connected
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Lab" value={stats.totalRuangan} Icon={FlaskConical} color="bg-blue-500" />
            <StatCard title="Lab Sedang Aktif" value={stats.aktifSekarang} Icon={DoorOpen} color="bg-emerald-500" />
            <StatCard title="Total Kelas" value={stats.totalKelas} Icon={Clock} color="bg-orange-500" />
            <StatCard title="Total Akses" value={stats.totalAkses} Icon={Check} color="bg-indigo-500" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-gray-800">Statistik Penggunaan</h3>
                <p className="text-xs text-gray-400 mt-1">Trend akses laboratorium</p>
              </div>
              <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium">
                {["monthly", "daily"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      chartMode === mode ? "bg-white shadow text-emerald-600 font-semibold" : "text-gray-500"
                    }`}
                  >
                    {mode === "monthly" ? "Bulanan" : "30 Hari"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[350px] w-full notranslate" translate="no">
              <AccessChart data={chartData} type={chartMode} />
            </div>
          </div>
        </div>
      </RoleBasedGuard>
    </AuthGuard>
  );
}

function StatCard({ title, value, Icon, color }: any) {
  return (
    <div className={`${color} text-white p-6 rounded-xl shadow-md flex items-center gap-4 transition-transform hover:-translate-y-1`}>
      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h3 className="text-xs font-medium opacity-90 uppercase tracking-wide">{title}</h3>
        <p className="text-2xl font-bold mt-0.5 notranslate" translate="no">{value || 0}</p>
      </div>
    </div>
  );
}