"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service"; // Import Service
import { Loader2 } from "lucide-react";

// Interface (sesuai data yang diterima)
interface ProfileData {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  kartuUid: string;
  kartuId: number;
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk form password
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Data Profil (GET) menggunakan authService
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        
        if (response.success) {
          setProfile(response.data);
        } else {
          toast.error("Gagal memuat profil");
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  // 2. Submit Ganti Password (POST) menggunakan authService
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.changePassword({
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
        confirmPassword: passForm.confirmPassword
      });

      if (response.success) {
        toast.success("Password berhasil diubah!");
        setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(response.message || "Gagal mengubah password");
      }
    } catch (error: any) {
        const errorMessage = error?.response?.data?.message || "Terjadi kesalahan server";
        toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil Saya</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KARTU 1: Informasi User */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">
            Data Pengguna
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 block">Username</label>
              <p className="font-medium text-gray-800 text-lg">{profile?.username}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block">Role</label>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1 font-semibold uppercase">
                  {profile?.role}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-500 block">ID Sistem</label>
                <p className="font-medium text-gray-800">#{profile?.id}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
              <label className="text-sm text-gray-500 block mb-2 font-semibold">Informasi Kartu RFID</label>
              <div className="flex justify-between items-center">
                <span className="text-sm font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                    {profile?.kartuUid || "Belum ada kartu"}
                </span>
                <span className="text-xs text-gray-400">ID: {profile?.kartuId}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block">Bergabung Sejak</label>
              <p className="text-sm text-gray-700">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric'
                }) : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* KARTU 2: Ganti Password */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-orange-600 border-b pb-2">
            Keamanan (Ganti Password)
          </h2>

          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
              <input
                type="password"
                name="oldPassword"
                value={passForm.oldPassword}
                onChange={handlePassChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                placeholder="Masukkan password saat ini"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <input
                type="password"
                name="newPassword"
                value={passForm.newPassword}
                onChange={handlePassChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                name="confirmPassword"
                value={passForm.confirmPassword}
                onChange={handlePassChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition text-sm ${
                  passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Ulangi password baru"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}