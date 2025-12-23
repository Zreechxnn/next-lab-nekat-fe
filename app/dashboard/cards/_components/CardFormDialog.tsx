"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Wifi } from "lucide-react";
import { userService } from "@/services/user.service";
import { classService } from "@/services/class.service";
import { cardService } from "@/services/card.service";
import { scanService } from "@/services/scan.service";
import { toast } from "sonner";

interface CardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function CardFormDialog({ open, onClose, onSuccess, initialData }: CardFormDialogProps) {
  const [loading, setLoading] = useState(false);

  // State Polling
  const [isScanning, setIsScanning] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastUidRef = useRef<string>("");

  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // State Form
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState("AKTIF");
  const [keterangan, setKeterangan] = useState("");
  const [ownerType, setOwnerType] = useState("none");
  const [selectedUserId, setSelectedUserId] = useState("0");
  const [selectedClassId, setSelectedClassId] = useState("0");

  // 1. Load Data User & Kelas
  useEffect(() => {
    if (open) {
      const loadOptions = async () => {
        try {
          const [uRes, cRes] = await Promise.all([userService.getAll(), classService.getAll()]);
          if (uRes.success) setUsers(uRes.data);
          if (cRes.success) setClasses(cRes.data);
        } catch (e) {
          console.error("Gagal load options", e);
        }
      };
      loadOptions();

      // Reset ref polling saat modal dibuka
      lastUidRef.current = "";
    }

    return () => stopPolling();
  }, [open]);

  // 2. Set Initial Data (Mode Edit)
  useEffect(() => {
    if (open) {
      if (initialData) {
        setUid(initialData.uid);
        setStatus(initialData.status);
        setKeterangan(initialData.keterangan || "");

        if (initialData.userId && initialData.userId !== 0) {
          setOwnerType("user");
          setSelectedUserId(String(initialData.userId));
          setSelectedClassId("0");
        } else if (initialData.kelasId && initialData.kelasId !== 0) {
          setOwnerType("class");
          setSelectedClassId(String(initialData.kelasId));
          setSelectedUserId("0");
        } else {
          setOwnerType("none");
          setSelectedUserId("0");
          setSelectedClassId("0");
        }
      } else {
        // Mode Tambah Baru (Reset Form)
        setUid("");
        setStatus("AKTIF");
        setKeterangan("");
        setOwnerType("none");
        setSelectedUserId("0");
        setSelectedClassId("0");
      }
    }
  }, [open, initialData]);

  const startPolling = () => {
    if (pollingRef.current) return;

    setIsScanning(true);
    toast.info("Mencari data kartu terbaru dari server...");

    // Cek setiap 1.5 detik
    pollingRef.current = setInterval(async () => {
      try {
        const res = await scanService.getLatest();
        if (res.success && res.data && res.data.uid) {
          const serverUid = res.data.uid;

          // Jika UID dari server BEDA dengan yg terakhir kita tahu
          if (serverUid !== lastUidRef.current && serverUid !== uid) {
            setUid(serverUid);
            lastUidRef.current = serverUid;

            toast.success(`Kartu ditemukan: ${serverUid}`);
            stopPolling();
          }
        }
      } catch (error) {
        // Silent error
      }
    }, 1500);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      uid,
      status,
      keterangan,
      userId: ownerType === 'user' && selectedUserId !== "0" ? Number(selectedUserId) : null,
      kelasId: ownerType === 'class' && selectedClassId !== "0" ? Number(selectedClassId) : null
    };

    try {
      let res;

      if (initialData?.id) {
        // Mode Edit: Update by ID
        res = await cardService.update(initialData.id, payload);
      } else {
        // Mode Create
        res = await cardService.create(payload);
      }

      if (res.success) {
        toast.success(initialData ? "Kartu diperbarui" : "Kartu berhasil disimpan");
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Gagal menyimpan data");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopPolling(); onClose(); }}>
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Kartu" : "Registrasi Kartu Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>UID Kartu</Label>
            <div className="flex gap-2">
              {/* PERUBAHAN DISINI:
                   1. Menghapus properti readOnly={!!initialData}
                   2. Menghapus className background gray 
                */}
              <Input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Scan kartu atau ketik manual..."
                required
              />

              {/* Tombol Scan tetap ada untuk opsional */}
              <Button
                type="button"
                variant={isScanning ? "destructive" : "secondary"}
                onClick={isScanning ? stopPolling : startPolling}
                className="min-w-[120px]"
              >
                {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
                {isScanning ? "Stop" : "Scan Alat"}
              </Button>
            </div>
            {isScanning && (
              <p className="text-xs text-blue-600 animate-pulse">
                Menunggu kartu di-tap pada alat...
              </p>
            )}
            {!isScanning && (
              <p className="text-[10px] text-gray-500">
                Anda bisa mengetik UID secara manual atau menggunakan tombol <b>"Scan Alat"</b> untuk mengisi otomatis.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="NONAKTIF">Non-Aktif</SelectItem>
                <SelectItem value="BLOCKED">di-blokir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Jenis Pemilik</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="otype" checked={ownerType === 'none'} onChange={() => setOwnerType('none')} />
                Tidak Ada
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="otype" checked={ownerType === 'user'} onChange={() => setOwnerType('user')} />
                User
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="otype" checked={ownerType === 'class'} onChange={() => setOwnerType('class')} />
                Kelas
              </label>
            </div>
          </div>

          {ownerType === 'user' && (
            <div className="grid gap-2">
              <Label>Pilih User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Pilih User" /></SelectTrigger>
                <SelectContent className="z-[9999] max-h-60">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.username} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {ownerType === 'class' && (
            <div className="grid gap-2">
              <Label>Pilih Kelas</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent className="z-[9999] max-h-60">
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Keterangan</Label>
            <Input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Opsional"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Simpan Perubahan" : "Simpan Kartu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}