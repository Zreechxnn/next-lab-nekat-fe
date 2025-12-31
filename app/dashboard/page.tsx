/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import AccessChart from "@/components/shared/AccessChart";
import { dashboardService } from "@/services/dashboard.service";
import { toast } from "sonner";
import AuthGuard from "@/components/shared/AuthGuard";
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
      const token = getAuthToken();
      if (!token) return;
      const res = await dashboardService.overviewStats();
      if (res.success && isMounted.current) setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChartData = async (mode: string) => {
    try {
      const token = getAuthToken();

      let res;

      if (mode === "monthly") {
        res = await dashboardService.monthlyStats();
      } else {
        res = await dashboardService.last30DayStats();
      }

      if (res.success && isMounted.current) {
        const formattedData = res.data.map((item: any) => ({
          name: mode === "monthly" ? item.bulan : item.tanggal,
          value: item.total,
        }));
        setChartData(formattedData);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat load chart!");
      console.error("Gagal load chart", err);
    }
  };

  useEffect(() => {
    const fetchChartDataEffect = async (mode: string) => {
      fetchChartData(mode);
    };

    fetchChartDataEffect(chartMode);
  }, [chartMode]);

  useEffect(() => {
    isMounted.current = true;
    const token = getAuthToken();
    if (!token) {
      router.push("/");
      return;
    }

    const fetchStatsEffect = async () => {
      await fetchStats();
    };

    const fetchChartDataEffect = async (mode: string) => {
      await fetchChartData(mode);
    };

    fetchStatsEffect();
    fetchChartDataEffect("monthly");

    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
          if (connection) {
            if (
              (connection.state as unknown as HubConnectionState) ===
              HubConnectionState.Connected
            ) {
              await connection.invoke("JoinDashboard");
            }
          }

          connection.on(
            "ReceiveDashboardStats",
            (data) => isMounted.current && setStats(data)
          );

          const refreshAll = () => {
            fetchStats();
            fetchChartData(chartMode);
          };

          connection.on("UpdateDashboard", refreshAll);
          connection.on("ReceiveCheckIn", refreshAll);
          connection.on("ReceiveCheckOut", refreshAll);

          connection.on("UserStatusChanged", () => {});
        }
      } catch (e) {
        /* ignore */
      }
    };

    setTimeout(startSignalR, 500);

    return () => {
      isMounted.current = false;
      if (connection) connection.stop().catch(() => {});
    };
  }, []);

  return (
    <AuthGuard>
      <div className="font-sans space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h1 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <LayoutDashboard className="text-emerald-600" /> Dashboard
          </h1>
          <div className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Connected
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Lab"
            value={stats.totalRuangan || 0}
            Icon={FlaskConical}
            color="bg-blue-500" // Tetap biru untuk identitas 'Lab'
          />
          <StatCard
            title="Lab Sedang Aktif"
            value={stats.aktifSekarang || 0}
            Icon={DoorOpen}
            color="bg-emerald-500" // Emerald untuk menandakan status 'Aktif'
          />
          <StatCard
            title="Total Kelas"
            value={stats.totalKelas || 0}
            Icon={Clock}
            color="bg-orange-500" // Orange untuk waktu/kelas
          />
          <StatCard
            title="Total Akses (Hari Ini)"
            value={stats.totalAkses || 0}
            Icon={Check}
            color="bg-indigo-500" // Indigo untuk data akumulasi
          />
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-gray-800">
                Statistik Penggunaan
              </h3>
              <p className="text-xs text-gray-400 mt-1">Trend akses laboratorium</p>
            </div>

            {/* Switch */}
            <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium">
              <button
                onClick={() => setChartMode("monthly")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  chartMode === "monthly"
                    ? "bg-white shadow text-emerald-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setChartMode("daily")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  chartMode === "daily"
                    ? "bg-white shadow text-emerald-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                30 Hari Terakhir
              </button>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <AccessChart data={chartData} type={chartMode} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function StatCard({
  title,
  value,
  Icon,
  color,
}: {
  title: string;
  value: number;
  Icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      className={`${color} text-white p-6 rounded-xl shadow-md flex items-center gap-4 transition-transform hover:-translate-y-1`}
    >
      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h3 className="text-xs font-medium opacity-90 uppercase tracking-wide">{title}</h3>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}