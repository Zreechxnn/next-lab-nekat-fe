"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, DoorOpen, Clock, ChartPie } from "lucide-react";

// --- Komponen Dialog Edit Catatan ---
export function EditNoteDialog({ open, onOpenChange, value, onChange, onSave }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Catatan Aktivitas</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label>Keterangan</Label>
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder="Contoh: Izin terlambat, Perbaikan PC, dll."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-700">Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Komponen Kartu Statistik ---
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
      <StatCard title="Total Aktivitas" val={stats.total} bg="bg-blue-500" Icon={Check} />
      <StatCard title="Sedang Aktif" val={stats.active} bg="bg-orange-500" Icon={DoorOpen} />
      <StatCard title="Rata Durasi" val={stats.avgDuration} bg="bg-purple-500" Icon={Clock} />
      <StatCard title="Lab Terpopuler" val={stats.popularLab} bg="bg-pink-500" Icon={ChartPie} />
    </div>
  );
}