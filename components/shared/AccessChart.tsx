/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AccessChart({
  data,
  type,
}: {
  data: any;
  title?: string;
  type: string;
}) {
  // 1. State untuk memastikan komponen hanya render Chart setelah mount di client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
        Belum ada data statistik
      </div>
    );
  }

  // 2. Jika belum mounted, tampilkan placeholder kosong dengan tinggi yang sama
  // Ini mencegah ResponsiveContainer menghitung nilai -1
  if (!isMounted) return <div className="w-full h-full" />;

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            interval={type === "daily" ? 4 : 0} // Mengurangi kepadatan label tanggal
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false} // Statistik akses biasanya bilangan bulat
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            itemStyle={{ color: "#10b981", fontWeight: "bold" }}
            cursor={{ stroke: "#10b981", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTotal)"
            isAnimationActive={true} // Pastikan animasi aktif
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}