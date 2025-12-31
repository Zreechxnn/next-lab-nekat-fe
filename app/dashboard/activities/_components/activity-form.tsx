"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, DoorOpen, Clock, ChartPie } from "lucide-react";

// --- Komponen Dialog Edit Catatan (Updated) ---
export function EditNoteDialog({ open, onOpenChange, value, onChange, onSave }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Catatan Aktivitas</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label className="font-semibold text-gray-700">Keterangan / Alasan</Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tulis keterangan lengkap di sini (contoh: Izin sakit, Perbaikan hardware, dll)..."
            className="min-h-[120px] resize-none focus-visible:ring-emerald-500"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Simpan Catatan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Komponen Kartu Statistik (Tetap menggunakan warna pembeda) ---
export function StatCard({ title, val, bg, Icon }: any) {
  return (
    <div className={`${bg} rounded-xl p-5 flex items-center gap-4 text-white shadow-md`}>
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
        <Icon size={28} />
      </div>
      <div>
        <p className="text-xs font-medium opacity-90">{title}</p>
        <p className="text-lg font-bold leading-tight">{val}</p>
      </div>
    </div>
  );
}

export function ActivityStats({ stats }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Warna statistik dibiarkan variatif agar mudah dibedakan secara visual */}
      <StatCard title="Total Aktivitas" val={stats.total} bg="bg-emerald-500" Icon={Check} />
      <StatCard title="Sedang Aktif" val={stats.active} bg="bg-blue-500" Icon={DoorOpen} />
      <StatCard title="Rata Durasi" val={stats.avgDuration} bg="bg-orange-500" Icon={Clock} />
      <StatCard title="Lab Terpopuler" val={stats.popularLab} bg="bg-purple-500" Icon={ChartPie} />
    </div>
  );
}