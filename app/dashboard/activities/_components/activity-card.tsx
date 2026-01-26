"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Pencil, Trash, MapPin, User, BookOpen } from "lucide-react"; // Import BookOpen
import { formatDateTime, calculateDuration } from "@/utils/activity-helpers";

interface ActivityCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function ActivityCard({ item, onEdit, onDelete }: ActivityCardProps) {
  const isCheckOut = item.timestampKeluar && new Date(item.timestampKeluar).getFullYear() !== 1 && item.timestampMasuk !== item.timestampKeluar;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all hover:shadow-md">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCheckOut ? 'bg-gray-300' : 'bg-emerald-500'}`} />

      <div className="flex justify-between items-start pl-3">
        <div>
          <h4 className="font-bold text-gray-800 text-sm truncate max-w-[200px]">
            {item.userUsername ?? item.kelasNama ?? "Unknown"}
          </h4>

          {item.userUsername && item.userKelasNama && (
             <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium mt-1 bg-indigo-50 w-fit px-1.5 py-0.5 rounded border border-indigo-100">
                <BookOpen size={10} /> {item.userKelasNama}
             </div>
          )}

          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 font-mono bg-gray-50 px-1.5 py-0.5 rounded w-fit">
             <User size={10} /> {item.kartuUid}
          </div>
        </div>
        <Badge variant={isCheckOut ? "secondary" : "default"} className={`text-[10px] ${isCheckOut ? 'bg-gray-100 text-gray-500 shadow-none' : 'bg-emerald-100 text-emerald-700 shadow-none border-emerald-200'}`}>
          {isCheckOut ? "SELESAI" : "AKTIF"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pl-3 mt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-400 font-medium flex items-center gap-1"><MapPin size={10}/> Ruangan</span>
          <span className="font-semibold text-gray-700 truncate">{item.ruanganNama}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-400 font-medium flex items-center gap-1"><Clock size={10}/> Durasi</span>
          <span className="font-semibold text-emerald-600">{calculateDuration(item.timestampMasuk, item.timestampKeluar)}</span>
        </div>
      </div>

      <div className="bg-gray-50 p-2.5 rounded-lg text-xs flex justify-between items-center ml-3 border border-gray-100">
         <span className="text-emerald-700 font-medium">{formatDateTime(item.timestampMasuk)}</span>
         <ArrowRight size={12} className="text-gray-300" />
         <span className={isCheckOut ? "text-red-500 font-medium" : "text-gray-400 italic"}>
            {isCheckOut ? formatDateTime(item.timestampKeluar) : "..."}
         </span>
      </div>

      <div className="flex items-center justify-between pl-3 pt-2 mt-1 border-t border-gray-100">
         <p className="text-xs text-gray-500 truncate max-w-[180px] italic pr-2">
           {item.keterangan || "Tidak ada catatan"}
         </p>
         <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full" onClick={() => onEdit(item)}>
               <Pencil size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => onDelete(item.id)}>
               <Trash size={14} />
            </Button>
         </div>
      </div>
    </div>
  );
}