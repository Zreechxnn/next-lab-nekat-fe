"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, DoorOpen, Clock, ChartPie } from "lucide-react";

export function EditNoteDialog({ open, onOpenChange, value, onChange, onSave, isReadOnly }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isReadOnly ? "Detail Catatan Aktivitas" : "Edit Catatan Aktivitas"}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label className="font-semibold text-gray-700">Keterangan / Alasan</Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isReadOnly ? "Tidak ada catatan." : "Tulis keterangan lengkap di sini..."}
            className="min-h-[120px] resize-none focus-visible:ring-emerald-500 disabled:opacity-100 disabled:bg-gray-50 disabled:text-gray-700"
            disabled={isReadOnly} 
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isReadOnly ? "Tutup" : "Batal"}
          </Button>
          {/* Update: Tombol simpan hilang jika readOnly */}
          {!isReadOnly && (
            <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Simpan Catatan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StatCard({ title, val, bg, Icon }: any) {
  return (
    <div className={`${bg} rounded-xl p-5 flex items-center gap-4 text-white shadow-md transition-all hover:scale-[1.02]`}>
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <Icon size={24} />
      </div>
      <div className="overflow-hidden">
        <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider truncate">{title}</p>
        <p className="text-lg font-bold leading-tight truncate">{val}</p>
      </div>
    </div>
  );
}

export function ActivityStats({ stats }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Aktivitas" val={stats.total} bg="bg-emerald-500" Icon={Check} />
      <StatCard title="Sedang Aktif" val={stats.active} bg="bg-blue-500" Icon={DoorOpen} />
      <StatCard title="Rata Durasi" val={stats.avgDuration} bg="bg-orange-500" Icon={Clock} />
      <StatCard title="Lab Terpopuler" val={stats.popularLab} bg="bg-purple-500" Icon={ChartPie} />
    </div>
  );
}