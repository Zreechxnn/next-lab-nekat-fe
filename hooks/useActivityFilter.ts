/* eslint-disable @typescript-eslint/no-explicit-any */
import { classService } from "@/services/class.service";
import { roomService } from "@/services/room.service";
import { userService } from "@/services/user.service";
import { useState, useEffect, useMemo } from "react";

export function useActivityFilter(rawData: any) {
  const [options, setOptions] = useState<{
    labs: any[];
    kelas: any[];
    users: any[];
  }>({
    labs: [],
    kelas: [],
    users: [],
  });

  const initialFilters = {
    lab: "",
    kelas: "",
    user: "",
    status: "",
    startDate: "",
    endDate: "",
  };

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const fetchOptions = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      try {
        const [resLab, resKelas, resUser] = await Promise.all([
          roomService.getAll(),
          classService.getAll(),
          userService.getAll(),
        ]);

        setOptions({
          labs: resLab.success ? resLab.data : [],
          kelas: resKelas.success ? resKelas.data : [],
          users: resUser.success ? resUser.data : [],
        });
      } catch (error) {
        console.error("Gagal memuat filter options", error);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (e: any) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Ganti nama dari handleReset ke resetFilters agar sinkron dengan page.tsx
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredData = useMemo(() => {
    if (!rawData) return [];

    return rawData.filter((item: any) => {
      if (filters.lab && String(item.ruanganId) !== String(filters.lab)) return false;

      if (filters.kelas) {
        const filterId = String(filters.kelas);
        const kartuKelasId = item.kelasId ? String(item.kelasId) : "";
        const userKelasId = item.userKelasId ? String(item.userKelasId) : "";
        if (kartuKelasId !== filterId && userKelasId !== filterId) return false;
      }

      if (filters.user) {
        const selectedUserObj = options.users.find(u => String(u.id) === String(filters.user));
        if (!item.userUsername || (selectedUserObj && item.userUsername !== selectedUserObj.username)) return false;
      }

      if (filters.status) {
        const hasCheckout = item.timestampKeluar && item.timestampKeluar !== "0001-01-01T00:00:00";
        const isOut = hasCheckout && item.timestampMasuk !== item.timestampKeluar;
        if (filters.status === "CHECKIN" && isOut) return false;
        if (filters.status === "CHECKOUT" && !isOut) return false;
      }

      const itemDate = new Date(item.timestampMasuk);
      itemDate.setHours(0, 0, 0, 0);

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999); // Set ke akhir hari agar data hari tersebut ikut terjaring
        if (itemDate > end) return false;
      }

      return true;
    });
  }, [rawData, filters, options]);

  return {
    options,
    filters,
    handleFilterChange,
    resetFilters, // Pastikan ini diekspor
    filteredData,
  };
}