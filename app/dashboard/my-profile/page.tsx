"use client";

import { useState, useEffect, useRef } from "react"; // Tambah useRef
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { Loader2, Pencil, X, Check, User, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// IMPORT SIGNALR
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";

interface ProfileData {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  kartuUid: string;
  kartuId: number;
  // Tambahan info kelas jika ada dari backend
  kelasNama?: string; 
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref untuk SignalR
  const connectionRef = useRef<HubConnection | null>(null);

  // State untuk Edit Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State untuk Ganti Password
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success) {
        setProfile(response.data);
        setEditUsername(response.data.username);
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

  // --- INTEGRASI SIGNALR (Realtime Update dari Admin/Device Lain) ---
  useEffect(() => {
    // Hanya connect jika profile sudah dimuat (kita butuh ID user untuk validasi)
    if (!profile) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const connection = createSignalRConnection(token);
    connectionRef.current = connection;

    const startSignalR = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();

          // Dengarkan notifikasi user
          connection.on("UserNotification", (payload: any) => {
            // Cek apakah update ini untuk SAYA SENDIRI
            if (payload.Data && payload.Data.id === profile.id) {
               console.log("Profile updated by system/admin:", payload);
               
               if (payload.EventType === "USER_UPDATED") {
                  // Refresh data profil agar sinkron (misal Admin ganti Role/Kelas)
                  fetchProfile();
                  toast.info("Profil anda telah diperbarui.");
               }
            }
          });

        } catch (e) {
          console.error("SignalR Error", e);
        }
      }
    };

    startSignalR();

    return () => {
      if (connection) connection.stop().catch(() => {});
    };
  }, [profile?.id]); // Dependency ke profile.id
  // -------------------------------------------------------------

  // --- LOGIC EDIT PROFILE ---
  const handleEditClick = () => {
    setEditUsername(profile?.username || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUsername(profile?.username || "");
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      toast.error("Username tidak boleh kosong");
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await authService.updateProfile({ username: editUsername });

      if (response.success) {
        toast.success("Profil berhasil diperbarui!");
        // Update state lokal langsung
        setProfile((prev) => (prev ? { ...prev, username: editUsername } : null));
        setIsEditing(false);
      } else {
        toast.error(response.message || "Gagal update profil");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- LOGIC GANTI PASSWORD ---
  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok!");
      return;
    }

    setIsSubmittingPass(true);
    try {
      const response = await authService.changePassword({
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
        confirmPassword: passForm.confirmPassword,
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
      setIsSubmittingPass(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );

  return (
    <div className="space-y-6 font-sans pb-20">
      {/* Header Section Konsisten */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <User className="text-emerald-600" /> Profil Saya
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KARTU 1: Data Pengguna & Edit Profile */}
        <Card className="h-fit shadow-sm border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Data Pengguna
              </CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditClick}
                  className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  title="Edit Profil"
                >
                  <Pencil size={18} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <Label className="text-gray-500 font-medium">Username</Label>
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="focus-visible:ring-emerald-500"
                  />
                  <Button
                    size="icon"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSavingProfile}
                    className="shrink-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <p className="font-semibold text-gray-800 text-lg">{profile?.username}</p>
              )}
            </div>

            {/* Role & ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-gray-500 text-xs uppercase tracking-wider">Role</Label>
                <div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 uppercase">
                    {profile?.role}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-500 text-xs uppercase tracking-wider">ID Sistem</Label>
                <p className="font-mono font-medium text-gray-700">#{profile?.id}</p>
              </div>
            </div>

            {/* Info Kartu RFID */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600 border border-slate-100">
                  <CreditCard size={20} />
                </div>
                <div className="flex-1">
                  <Label className="text-gray-600 font-semibold">Kartu Akses RFID</Label>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-mono text-sm font-bold text-gray-800 tracking-wide">
                      {profile?.kartuUid ? profile.kartuUid.split(":").join(" : ") : "Belum terhubung"}
                    </span>
                    {profile?.kartuId && (
                      <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border">
                        ID: {profile?.kartuId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Info Kelas (Jika Ada) */}
            {profile?.kelasNama && (
                <div className="pt-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider">Kelas</Label>
                    <p className="font-semibold text-gray-700">{profile.kelasNama}</p>
                </div>
            )}

            <div className="pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Bergabung sejak {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                }) : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KARTU 2: Ganti Password */}
        <Card className="h-fit shadow-sm border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="text-orange-500" />
              Keamanan Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Password Lama</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  name="oldPassword"
                  value={passForm.oldPassword}
                  onChange={handlePassChange}
                  required
                  placeholder="Masukkan password saat ini"
                  className="focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={passForm.newPassword}
                  onChange={handlePassChange}
                  required
                  placeholder="Minimal 6 karakter"
                  className="focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={passForm.confirmPassword}
                  onChange={handlePassChange}
                  required
                  placeholder="Ulangi password baru"
                  className={`focus-visible:ring-emerald-500 ${
                    passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword && (
                  <p className="text-xs text-red-500">Password tidak cocok</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmittingPass}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isSubmittingPass && <Loader2 className="animate-spin mr-2" size={16} />}
                {isSubmittingPass ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}