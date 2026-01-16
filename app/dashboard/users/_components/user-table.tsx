import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";

interface UserTableProps {
  data: any[];
  loading: boolean;
  page: number;
  limit: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: number, username: string) => void;
}

export function UserTable({ data, loading, page, limit, onEdit, onConfirmDelete }: UserTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden hidden md:block">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-gray-50/80">
            <TableHead className="w-16 text-center font-bold text-gray-600">No</TableHead>
            <TableHead className="font-bold text-gray-600">Username</TableHead>
            <TableHead className="font-bold text-gray-600">Role</TableHead>
            {/* Kolom Baru */}
            <TableHead className="font-bold text-gray-600">Kelas</TableHead>
            <TableHead className="text-center font-bold text-gray-600 w-[140px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="py-12 text-center text-gray-500">Memuat data pengguna...</TableCell></TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="py-12 text-center text-gray-400 italic">Data pengguna kosong.</TableCell></TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                <TableCell className="text-center font-mono text-gray-500 text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                <TableCell>
                   <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 text-sm">{item.username}</span>
                   </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`
                    px-2.5 py-0.5 rounded-md font-medium
                    ${item.role === "admin" ? "bg-purple-100 text-purple-700" : 
                      item.role === "guru" ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"}
                  `}>
                    {item.role}
                  </Badge>
                </TableCell>
                {/* Data Kelas */}
                <TableCell>
                   {item.kelasNama ? (
                     <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold border border-gray-200">
                       {item.kelasNama}
                     </span>
                   ) : (
                     <span className="text-gray-400 text-xs italic">-</span>
                   )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" onClick={() => onEdit(item)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onConfirmDelete(item.id, item.username)}>
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