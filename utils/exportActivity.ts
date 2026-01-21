/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";

export const exportAktivitasToExcel = (data: any) => {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk diexport");
    return;
  }

  // --- Helper Formatter ---
  const formatTime = (iso: any) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (start: any, end: any) => {
    const dEnd = new Date(end);
    if (!end || start === end || dEnd.getFullYear() === 1) return "-";

    const diff = Math.floor(
      (dEnd.getTime() - new Date(start).getTime()) / 60000
    );
    return diff < 60
      ? `${diff} Menit`
      : `${Math.floor(diff / 60)} Jam ${diff % 60} Menit`;
  };

  const getStatus = (masuk: any, keluar: any) => {
    const dKeluar = new Date(keluar);
    const hasOut = keluar && dKeluar.getFullYear() !== 1;
    const isOut = hasOut && masuk !== keluar;
    return isOut ? "CHECK OUT" : "CHECK IN";
  };

  // --- Mapping Data (LOGIKA BARU: MEMISAHKAN KOLOM) ---
  const excelData = data.map((item: any, index: any) => {
    
    let namaPengguna = "-";
    let namaKelas = "-";
    let kategori = "-";

    if (item.userUsername) {
        // CASE 1: USER (Siswa/Guru)
        namaPengguna = item.userUsername;
        namaKelas = item.userKelasNama || "-"; // Ambil kelas user jika ada
        kategori = "User / Siswa";
    } else if (item.kelasNama) {
        // CASE 2: KARTU KELAS
        namaPengguna = "(Kartu Kelas)";
        namaKelas = item.kelasNama; // Ambil nama kelas dari kartu
        kategori = "Kartu Kelas";
    }

    const kartuIdFormatted = item.kartuUid
      ? item.kartuUid.split(":").join("") // Hapus titik dua biar bersih
      : "-";

    return {
      "No": index + 1,
      "Kategori": kategori,       
      "Nama Pengguna": namaPengguna, 
      "Kelas": namaKelas,          
      "Lab": item.ruanganNama || "-",
      "Kartu ID": kartuIdFormatted,
      "Waktu Masuk": formatTime(item.timestampMasuk),
      "Waktu Keluar":
        item.timestampKeluar &&
        new Date(item.timestampKeluar).getFullYear() !== 1
          ? formatTime(item.timestampKeluar)
          : "-",
      "Durasi": getDuration(item.timestampMasuk, item.timestampKeluar),
      "Status": getStatus(item.timestampMasuk, item.timestampKeluar),
      "Catatan": item.keterangan || "-",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  const wscols = [
    { wch: 5 },  // No
    { wch: 15 }, // Kategori
    { wch: 25 }, // Nama Pengguna
    { wch: 15 }, // Kelas
    { wch: 20 }, // Lab
    { wch: 15 }, // Kartu ID
    { wch: 20 }, // Masuk
    { wch: 20 }, // Keluar
    { wch: 15 }, // Durasi
    { wch: 15 }, // Status
    { wch: 40 }, // Catatan
  ];
  worksheet["!cols"] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Aktivitas");

  // --- Download File ---
  const fileName = `Laporan_Lab_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};