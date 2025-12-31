/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
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
  title,
  type,
}: {
  data: any;
  title?: string;
  type: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
        Belum ada data statistik
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {/* Menggunakan warna Emerald (#10b981) */}
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
            interval={type === "daily" ? 2 : 0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#888" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            itemStyle={{ color: "#10b981", fontWeight: "bold" }} // Warna teks tooltip Emerald
            cursor={{ stroke: "#10b981", strokeWidth: 1 }} // Garis kursor Emerald
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981" // Garis grafik Emerald
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTotal)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}