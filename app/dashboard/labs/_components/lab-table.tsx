"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

interface LabTableProps {
  data: any[];
  loading: boolean;
  page: number;
  limit: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: string, nama: string) => void;
}

export function LabTable({ data, loading, page, limit, onEdit, onConfirmDelete }: LabTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden hidden md:block">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-gray-50/80">
            <TableHead className="w-16 text-center font-bold text-gray-600">No</TableHead>
            <TableHead className="font-bold text-gray-600">Nama Laboratorium</TableHead>
            <TableHead className="text-center font-bold text-gray-600 w-[140px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={3} className="py-12 text-center text-gray-500">Memuat data...</TableCell></TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="py-12 text-center text-gray-400 italic">Data laboratorium kosong.</TableCell></TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                <TableCell className="text-center font-mono text-gray-500 text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                
                <TableCell>
                   {/* MODIFIKASI DISINI: ID dibuat seperti pangkat (superscript) */}
                   <div className="flex items-start gap-1">
                      <span className="font-semibold text-gray-800 text-sm relative top-[1px]">
                        {item.nama}
                      </span>
                      <sup className="text-[10px] font-mono text-indigo-400 font-medium select-none">
                        #{item.id}
                      </sup>
                   </div>
                </TableCell>
                
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
