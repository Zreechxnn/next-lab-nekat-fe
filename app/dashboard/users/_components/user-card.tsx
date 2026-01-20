import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, BookOpen } from "lucide-react"; // Import BookOpen

interface UserCardProps {
  item: any;
  index: number;
  onEdit: (item: any) => void;
  onConfirmDelete: (id: number, username: string) => void;
}

export function UserCard({ item, onEdit, onConfirmDelete }: UserCardProps) {
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
        case "admin": return "bg-red-100 text-red-700 border-red-200";
        case "guru": return "bg-orange-100 text-orange-700 border-orange-200";
        case "operator": return "bg-purple-100 text-purple-700 border-purple-200";
        default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative transition-all hover:shadow-md hover:border-indigo-200">
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100 shadow-sm">
            {item.username.substring(0, 2).toUpperCase()}
        </div>

        <div className="flex-1">
             <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 text-base">{item.username}</h4>
                <Badge variant="outline" className={`text-[10px] uppercase ${getRoleBadgeColor(item.role)}`}>
                    {item.role}
                </Badge>
             </div>
             
             {/* INFO KELAS JIKA ADA */}
             {item.kelasNama && (
                 <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600 bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                    <BookOpen size={12} className="text-gray-400" />
                    <span className="font-medium">{item.kelasNama}</span>
                 </div>
             )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          className="h-9 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 flex-1 border border-transparent hover:border-indigo-100"
        >
           <Edit size={14} className="mr-1.5" /> Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onConfirmDelete(item.id, item.username)}
          className="h-9 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 flex-1 border border-transparent hover:border-red-100"
        >
           <Trash size={14} className="mr-1.5" /> Hapus
        </Button>
      </div>
    </div>
  );
}