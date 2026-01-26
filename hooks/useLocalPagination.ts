"use client";
import { useState, useMemo, useCallback } from "react";

// Tipe untuk output hook
interface PaginationResult<T> {
  paginatedData: T[];
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setSearchQuery: (query: string) => void; // Untuk trigger search/filter
}

// Tipe untuk props hook
interface PaginationProps<T> {
  initialData: T[];
  itemsPerPage?: number;
  searchKeys: (keyof T)[]; // Kunci/kolom mana yang akan dicari (misal: ['nama', 'email'])
}

export function useLocalPagination<T>({
  initialData,
  itemsPerPage = 10,
  searchKeys,
}: PaginationProps<T>): PaginationResult<T> {
  // State untuk kontrol pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = itemsPerPage;

  // --- 1. Filtering Data (Lokal Search) ---
  const filteredData = useMemo(() => {
    if (!searchQuery) {
      return initialData;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();

    return initialData.filter((item) => {
      // Cek apakah item cocok dengan salah satu searchKeys
      return searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === "string" || typeof value === "number") {
          return String(value).toLowerCase().includes(lowerCaseQuery);
        }
        return false;
      });
    });
  }, [initialData, searchQuery, searchKeys]);

  // --- 2. Perhitungan Statistik Pagination ---
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / limit);

  // Pastikan currentPage tidak melebihi totalPages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  } else if (currentPage === 0 && totalItems > 0) {
    // Reset ke halaman 1 jika ada item
    setCurrentPage(1);
  }

  // --- 3. Slicing Data (Pagination) ---
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

  // --- 4. Fungsi Kontrol ---
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Reset ke halaman 1 ketika query pencarian berubah
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Sangat penting: Reset ke halaman 1 saat pencarian baru
  }, []);

  // --- 5. Return Nilai ---
  return {
    paginatedData,
    currentPage,
    limit,
    totalItems,
    totalPages: totalPages === 0 ? 1 : totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    setSearchQuery: handleSetSearchQuery,
  };
}
