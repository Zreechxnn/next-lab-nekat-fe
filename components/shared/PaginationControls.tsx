"use client";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Tipe props yang sama persis dengan output hook useLocalPagination (tanpa paginatedData dan setSearchQuery)
interface PaginationControlsProps {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function PaginationControls({
  currentPage,
  limit,
  totalItems,
  totalPages,
  hasNextPage,
  hasPrevPage,
  goToPage,
  nextPage,
  prevPage,
}: PaginationControlsProps) {
  // Hitung batas item yang ditampilkan
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex items-center justify-between p-4 border-t">
      {/* Informasi Status */}
      <div className="text-sm text-gray-600">
        Menampilkan {startItem} sampai {endItem} dari {totalItems} item.
      </div>

      {/* Tombol Kontrol */}
      <div className="flex items-center space-x-2">
        {/* Tombol ke Halaman Awal */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(1)}
          disabled={!hasPrevPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Tombol Halaman Sebelumnya */}
        <Button
          variant="outline"
          size="icon"
          onClick={prevPage}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Display Halaman Saat Ini */}
        <span className="text-sm font-medium">
          Halaman {currentPage} dari {totalPages}
        </span>

        {/* Tombol Halaman Berikutnya */}
        <Button
          variant="outline"
          size="icon"
          onClick={nextPage}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Tombol ke Halaman Akhir */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(totalPages)}
          disabled={!hasNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
