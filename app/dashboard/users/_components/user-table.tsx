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
    
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
        case "admin": return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
        case "guru": return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
        case "operator": return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
        default: return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hidden md:block">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-gray-50/80 border-b-gray-200">
            <TableHead className="w-16 text-center font-bold text-gray-600">No</TableHead>
            <TableHead className="font-bold text-gray-600">Pengguna</TableHead>
            <TableHead className="font-bold text-gray-600">Role</TableHead>
            {/* KOLOM KELAS DITAMBAHKAN */}
            <TableHead className="font-bold text-gray-600">Kelas</TableHead>
            <TableHead className="text-center font-bold text-gray-600 w-[120px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="py-12 text-center text-gray-500">Memuat data pengguna...</TableCell></TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="py-12 text-center text-gray-400 italic">Data pengguna kosong.</TableCell></TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                <TableCell className="text-center font-mono text-gray-400 text-xs">{(page - 1) * limit + idx + 1}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                          {item.username.substring(0, 2).toUpperCase()}
                       </div>
                       <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">{item.username}</span>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                       </div>
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full font-medium text-xs capitalize ${getRoleBadgeColor(item.role)}`}>
                    {item.role}
                  </Badge>
                </TableCell>
                
                {/* TAMPILKAN NAMA KELAS */}
                <TableCell>
                    {item.kelasNama ? (
                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                            {item.kelasNama}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400 italic">-</span>
                    )}
                </TableCell>

                <TableCell>
                  <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => onEdit(item)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => onConfirmDelete(item.id, item.username)}>
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