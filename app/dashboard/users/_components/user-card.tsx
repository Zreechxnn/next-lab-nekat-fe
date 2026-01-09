import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Edit, Trash, Shield } from "lucide-react";

interface UserCardProps {
  item: any;
  index: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: number, username: string) => void;
}

export function UserCard({ item, index, onEdit, onConfirmDelete }: UserCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative transition-all hover:shadow-md">
      {/* Header: Index & Icon */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-2">
        <div className="flex items-center gap-3">
           <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-xs font-mono text-gray-500">
             {index + 1}
           </span>
           <div>
              <h4 className="font-bold text-gray-800 text-base">{item.username}</h4>
              <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
           </div>
        </div>
        <div className="bg-indigo-50 p-2 rounded-full text-indigo-600">
           <User size={18} />
        </div>
      </div>

      {/* Body: Role */}
      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mt-1">
        <div className="flex items-center gap-2 text-xs text-gray-600">
           <Shield size={14} className="text-indigo-500"/>
           <span className="font-medium">Role Akses</span>
        </div>
        <Badge variant="secondary" className={`
          ${item.role === "admin" ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}
        `}>
           {item.role}
        </Badge>
      </div>

      {/* Footer: Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 mt-1 border-t border-gray-100">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(item)}
          className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 flex-1"
        >
           <Edit size={12} /> Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onConfirmDelete(item.id, item.username)}
          className="h-8 text-xs gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-none flex-1"
        >
           <Trash size={12} /> Hapus
        </Button>
      </div>
    </div>
  );
}