"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book, Calendar, Edit, GraduationCap, Trash } from "lucide-react";

interface ClassCardProps {
  item: any;
  index: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: string, nama: string) => void;
}

export function ClassCard({ item, index, onEdit, onConfirmDelete }: ClassCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative transition-all hover:shadow-md">
      {/* Header: Index & Nama */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-2">
        <div className="flex items-center gap-3">
           <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-mono text-gray-500">
             {index + 1}
           </span>
           <div>
              <h4 className="font-bold text-gray-800 text-sm">{item.nama}</h4>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-700">
                    Kls {item.tingkat}
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    {item.jurusanKode}
                </Badge>
              </div>
           </div>
        </div>
        <div className="bg-indigo-50 p-1.5 rounded-full text-indigo-600">
           <Book size={14} />
        </div>
      </div>

      {/* Body: Periode Info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
            <Calendar size={14} className="text-indigo-500" />
            <span className="font-medium truncate">{item.periodeNama}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
            <GraduationCap size={14} className="text-emerald-500" />
            <span className="font-medium truncate">{item.jurusanNama}</span>
        </div>
      </div>

      {/* Footer: Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
          className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1"
        >
           <Edit size={12} /> Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onConfirmDelete(item.id, item.nama)}
          className="h-8 text-xs gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-none"
        >
           <Trash size={12} /> Hapus
        </Button>
      </div>
    </div>
  );
}