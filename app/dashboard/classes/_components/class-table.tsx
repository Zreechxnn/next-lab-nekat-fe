import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClassTableProps {
  data: any[];
  loading: boolean;
  page: number;
  limit: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: string, nama: string) => void;
}

export function ClassTable({ data, loading, page, limit, onEdit, onConfirmDelete }: ClassTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden hidden md:block">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-gray-50/80">
            <TableHead className="w-16 text-center font-bold text-gray-600">No</TableHead>
            <TableHead className="font-bold text-gray-600">Nama Kelas</TableHead>
            <TableHead className="font-bold text-gray-600">Tingkat</TableHead>
            <TableHead className="font-bold text-gray-600">Jurusan</TableHead>
            <TableHead className="font-bold text-gray-600">Periode</TableHead>
            <TableHead className="text-center font-bold text-gray-600 w-[140px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-500">Memuat data...</TableCell></TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-gray-400 italic">Data kosong.</TableCell></TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                <TableCell className="text-center font-mono text-gray-500 text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                
                {/* Nama Kelas */}
                <TableCell>
                   <span className="font-bold text-gray-800 text-sm">
                     {item.nama}
                   </span>
                </TableCell>

                {/* Tingkat */}
                <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Kelas {item.tingkat}
                    </Badge>
                </TableCell>

                {/* Jurusan */}
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-semibold text-xs text-gray-700">{item.jurusanKode}</span>
                        <span className="text-[10px] text-gray-400">{item.jurusanNama}</span>
                    </div>
                </TableCell>

                {/* Periode */}
                <TableCell className="text-gray-600 text-sm">{item.periodeNama}</TableCell>
                
                {/* Aksi */}
                <TableCell>
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" onClick={() => onEdit(item)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onConfirmDelete(item.id, item.nama)}>
                      <Trash size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}