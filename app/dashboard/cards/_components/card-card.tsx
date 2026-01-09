import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IdCard, Edit, Trash, User, Users } from "lucide-react";

interface CardCardProps {
  item: any;
  index: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: number, uid: string) => void;
}

export function CardCard({ item, index, onEdit, onConfirmDelete }: CardCardProps) {
  const userName = item.userUsername;
  const className = item.kelasNama;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative transition-all hover:shadow-md">
      {/* Header: Index & UID */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-2">
        <div className="flex items-center gap-3">
           <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-xs font-mono text-gray-500">
             {index + 1}
           </span>
           <div>
              <h4 className="font-bold text-indigo-600 font-mono text-base tracking-wide">
                {item.uid ? item.uid.split(":").join(" : ") : "-"}
              </h4>
              <span className="text-[10px] text-gray-400">ID: {item.id}</span>
           </div>
        </div>
        <div className="bg-indigo-50 p-2 rounded-full text-indigo-600">
           <IdCard size={18} />
        </div>
      </div>

      {/* Body: Owner & Status */}
      <div className="grid grid-cols-2 gap-2 text-xs mt-1">
        <div className="flex flex-col gap-1">
           <span className="text-gray-400 font-medium">Pemilik</span>
           {userName ? (
              <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit">
                 <User size={10} /> <span className="truncate max-w-[90px]">{userName}</span>
              </div>
           ) : className ? (
              <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100 w-fit">
                 <Users size={10} /> <span className="truncate max-w-[90px]">{className}</span>
              </div>
           ) : (
              <span className="text-gray-400 italic">- Kosong -</span>
           )}
        </div>
        
        <div className="flex flex-col gap-1 items-end">
           <span className="text-gray-400 font-medium">Status</span>
           <Badge variant="outline" className={`
             border-0 px-2 py-0.5 text-[10px]
             ${item.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : ''}
             ${item.status === 'NONAKTIF' ? 'bg-gray-100 text-gray-600' : ''}
             ${item.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : ''}
           `}>
             {item.status}
           </Badge>
        </div>
      </div>

      {/* Footer: Keterangan & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
        <p className="text-[10px] text-gray-500 italic truncate max-w-[120px]">
           {item.keterangan || "Tanpa keterangan"}
        </p>
        <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => onEdit(item)} className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1">
               <Edit size={12} /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onConfirmDelete(item.id, item.uid)} className="h-7 text-xs gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-none">
               <Trash size={12} />
            </Button>
        </div>
      </div>
    </div>
  );
}