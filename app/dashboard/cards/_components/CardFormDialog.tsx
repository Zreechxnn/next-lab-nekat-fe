"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { userService } from "@/services/user.service";
import { classService } from "@/services/class.service";
import { cardService } from "@/services/card.service";
import { toast } from "sonner";

interface CardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function CardFormDialog({ open, onClose, onSuccess, initialData }: CardFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // State Form Sederhana
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState("AKTIF");
  const [keterangan, setKeterangan] = useState("");
  const [ownerType, setOwnerType] = useState("none"); // none, user, class
  const [selectedUserId, setSelectedUserId] = useState("0");
  const [selectedClassId, setSelectedClassId] = useState("0");

  // 1. Load Data User & Kelas saat modal dibuka
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
    }
  }, [open]);

  // 2. Set Nilai Awal Form (Reset atau Isi dari Edit)
  useEffect(() => {
    if (open) {
      if (initialData) {
        setUid(initialData.uid);
        setStatus(initialData.status);
        setKeterangan(initialData.keterangan || "");
        
        // Deteksi Owner Type
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
        // Mode Tambah: Reset Form
        setUid("");
        setStatus("AKTIF");
        setKeterangan("");
        setOwnerType("none");
        setSelectedUserId("0");
        setSelectedClassId("0");
      }
    }
  }, [open, initialData]);

  // 3. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Siapkan Payload
    // PERBAIKAN: Menggunakan null jika tipe tidak cocok atau ID masih "0"
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
        res = await cardService.update(initialData.id, payload);
      } else {
        res = await cardService.create(payload);
      }                                               

      if (res.success) {
        toast.success(initialData ? "Kartu diperbarui" : "Kartu berhasil ditambahkan");
        onSuccess(); // Refresh tabel
        onClose();   // Tutup modal
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Kartu" : "Tambah Kartu Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>UID Kartu</Label>
            <Input 
              value={uid} 
              onChange={(e) => setUid(e.target.value)}
              placeholder="Tempelkan kartu ke reader..." 
              required 
            />
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
                 <input 
                   type="radio" 
                   name="otype" 
                   checked={ownerType === 'none'} 
                   onChange={() => setOwnerType('none')} 
                 />
                 Tidak Ada
               </label>
               <label className="flex items-center gap-2 text-sm cursor-pointer">
                 <input 
                   type="radio" 
                   name="otype" 
                   checked={ownerType === 'user'} 
                   onChange={() => setOwnerType('user')} 
                 />
                 User
               </label>
               <label className="flex items-center gap-2 text-sm cursor-pointer">
                 <input 
                   type="radio" 
                   name="otype" 
                   checked={ownerType === 'class'} 
                   onChange={() => setOwnerType('class')} 
                 />
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
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}