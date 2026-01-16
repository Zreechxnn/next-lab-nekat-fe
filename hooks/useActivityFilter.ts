/* eslint-disable @typescript-eslint/no-explicit-any */
import { classService } from "@/services/class.service";
import { roomService } from "@/services/room.service";
import { userService } from "@/services/user.service";
import { useState, useEffect, useMemo } from "react";

export function useActivityFilter(rawData: any) {
  // State Options
  const [options, setOptions] = useState<{
    labs: any[];
    kelas: any[];
    users: any[];
  }>({
    labs: [],
    kelas: [],
    users: [],
  });

  // State Filters
  const [filters, setFilters] = useState({
    lab: "",
    kelas: "",
    user: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  // Fetch Options dari API (Server Side)
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
          // Backend harus kirim periodeNama di endpoint /Kelas agar dropdown jelas
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

  const handleReset = () => {
    setFilters({
      lab: "",
      kelas: "",
      user: "",
      status: "",
      startDate: "",
      endDate: "",
    });
  };

  // --- LOGIKA FILTERING UTAMA ---
  const filteredData = useMemo(() => {
    if (!rawData) return [];

    return rawData.filter((item: any) => {
      
      // 1. Filter Lab
      if (filters.lab) {
        if (String(item.ruanganId) !== String(filters.lab)) return false;
      }

      // 2. Filter Kelas (PERBAIKAN DISINI)
      if (filters.kelas) {
        const filterId = String(filters.kelas); // ID dari Dropdown (misal "5")

        // Ambil ID Kelas dari Kartu Kelas (jika ada)
        const kartuKelasId = item.kelasId ? String(item.kelasId) : "";
        
        // Ambil ID Kelas dari User Siswa (jika ada)
        const userKelasId = item.userKelasId ? String(item.userKelasId) : "";

        // Logika: Tampilkan jika Kartu Kelas COCOK --ATAU-- Siswa Kelas COCOK
        const isMatch = kartuKelasId === filterId || userKelasId === filterId;

        if (!isMatch) return false;
      }

      // 3. Filter User
      if (filters.user) {
        // Bandingkan Username karena di tabel log fieldnya userUsername
        // Kita cari username dari options berdasarkan ID yang dipilih di dropdown
        const selectedUserObj = options.users.find(
          (u) => String(u.id) === String(filters.user)
        );

        if (!item.userUsername) return false;

        if (selectedUserObj && item.userUsername !== selectedUserObj.username)
          return false;
      }

      // 4. Filter Status CheckIn/Out
      if (filters.status) {
        const hasCheckout =
          item.timestampKeluar &&
          item.timestampKeluar !== "0001-01-01T00:00:00";
        const isOut =
          hasCheckout && item.timestampMasuk !== item.timestampKeluar;

        if (filters.status === "CHECKIN" && isOut) return false;
        if (filters.status === "CHECKOUT" && !isOut) return false;
      }

      // 5. Filter Tanggal
      const itemDate = new Date(item.timestampMasuk);
      itemDate.setHours(0, 0, 0, 0);

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(0, 0, 0, 0);
        if (itemDate > end) return false;
      }

      return true;
    });
  }, [rawData, filters, options]);

  return {
    options,
    filters,
    handleFilterChange,
    handleReset,
    filteredData,
  };
}