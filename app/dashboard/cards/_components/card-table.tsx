"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, User, Users } from "lucide-react";

interface CardTableProps {
  data: any[];
  loading: boolean;
  page: number;
  limit: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: number, uid: string) => void;
}

export function CardTable({ data, loading, page, limit, onEdit, onConfirmDelete }: CardTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden hidden md:block">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-gray-50/80">
            <TableHead className="w-16 text-center font-bold text-gray-600">No</TableHead>
            <TableHead className="font-bold text-gray-600">UID Kartu</TableHead>
            <TableHead className="font-bold text-gray-600">Pemilik</TableHead>
            <TableHead className="font-bold text-gray-600">Status</TableHead>
            <TableHead className="font-bold text-gray-600">Keterangan</TableHead>
            <TableHead className="text-center font-bold text-gray-600 w-[120px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="py-12 text-center text-gray-500">Memuat data...</TableCell></TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-12 text-center text-gray-400 italic">Data kartu kosong.</TableCell></TableRow>
          ) : (
            data.map((item, idx) => {
               const userName = item.userUsername;
               const className = item.kelasNama;
               return (
                  <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <TableCell className="text-center font-mono text-gray-500 text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell className="font-mono font-bold text-indigo-600 tracking-wide text-sm">
                       {item.uid ? item.uid.split(":").join(" : ") : "-"}
                    </TableCell>
                    <TableCell>
                       {userName ? (
                          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 w-fit px-2.5 py-1 rounded text-xs font-semibold border border-blue-100">
                             <User size={12} /> {userName}
                          </div>
                       ) : className ? (
                          <div className="flex items-center gap-2 text-purple-700 bg-purple-50 w-fit px-2.5 py-1 rounded text-xs font-semibold border border-purple-100">
                             <Users size={12} /> {className}
                          </div>
                       ) : (
                          <span className="text-gray-400 text-xs italic">- Kosong -</span>
                       )}
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className={`
                          border-0 font-bold px-2.5 py-0.5 text-[10px]
                          ${item.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : ''}
                          ${item.status === 'NONAKTIF' ? 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' : ''}
                          ${item.status === 'BLOCKED' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : ''}
                       `}>
                          {item.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 italic truncate max-w-[150px]">{item.keterangan || "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" onClick={() => onEdit(item)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onConfirmDelete(item.id, item.uid)}>
                          <Trash size={14} />
                        </Button>
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