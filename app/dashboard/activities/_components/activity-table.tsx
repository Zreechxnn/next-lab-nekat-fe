import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Pencil, Trash } from "lucide-react";
import { formatDateTime, calculateDuration } from "@/utils/activity-helpers";

interface ActivityTableProps {
  data: any[];
  loading: boolean;
  page: number;
  limit: number;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function ActivityTable({ data, loading, page, limit, onEdit, onDelete }: ActivityTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden hidden md:block">
      <Table>
        <TableHeader className="bg-gray-100/80">
          <TableRow>
            <TableHead className="w-[50px] text-center font-bold text-gray-600">No</TableHead>
            <TableHead className="w-[200px] font-bold text-gray-600">Identitas</TableHead>
            <TableHead className="font-bold text-gray-600">Ruangan</TableHead>
            <TableHead className="font-bold text-gray-600">Waktu</TableHead>
            <TableHead className="font-bold text-gray-600">Durasi</TableHead>
            <TableHead className="font-bold text-gray-600">Status</TableHead>
            <TableHead className="w-[200px] font-bold text-gray-600">Catatan</TableHead>
            <TableHead className="w-[80px] text-right font-bold text-gray-600">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">Memuat data...</TableCell></TableRow>
          ) : data.length === 0 ? (
             <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-400 italic">Belum ada aktivitas.</TableCell></TableRow>
          ) : (
             data.map((item, idx) => {
               const isCheckOut = item.timestampKeluar && new Date(item.timestampKeluar).getFullYear() !== 1 && item.timestampMasuk !== item.timestampKeluar;
               return (
                 <TableRow key={item.id} className="hover:bg-emerald-50/50 transition-colors group">
                   <TableCell className="text-center text-gray-500 font-mono text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                   <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm">{item.userUsername ?? item.kelasNama}</span>
                        <span className="text-[10px] text-gray-500 font-mono border rounded w-fit px-1 bg-gray-50 mt-1">{item.kartuUid}</span>
                      </div>
                   </TableCell>
                   <TableCell className="text-sm font-medium text-gray-700">{item.ruanganNama}</TableCell>
                   <TableCell>
                      <div className="flex flex-col text-xs gap-1">
                         <span className="flex items-center gap-1 text-emerald-700 font-medium"><ArrowRight size={10}/> {formatDateTime(item.timestampMasuk)}</span>
                         {isCheckOut && <span className="flex items-center gap-1 text-gray-500"><ArrowRight size={10} className="text-red-400"/> {formatDateTime(item.timestampKeluar)}</span>}
                      </div>
                   </TableCell>
                   <TableCell>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                         <Clock size={10} /> {calculateDuration(item.timestampMasuk, item.timestampKeluar)}
                      </div>
                   </TableCell>
                   <TableCell>
                      <Badge variant={isCheckOut ? "secondary" : "default"} className={`text-[10px] ${isCheckOut ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                         {isCheckOut ? "SELESAI" : "AKTIF"}
                      </Badge>
                   </TableCell>
                   <TableCell className="text-xs text-gray-600 truncate max-w-[150px] italic">{item.keterangan || "-"}</TableCell>
                   <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-emerald-600" onClick={() => onEdit(item)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => onDelete(item.id)}><Trash size={14} /></Button>
                      </div>
                   </TableCell>
                 </TableRow>
               );
             })
          )}
        </TableBody>
      </Table>
    </div>
  );
}