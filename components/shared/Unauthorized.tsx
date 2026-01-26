"use client";
import { useRouter } from "next/navigation"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-red-100">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={32} />
          </div>
          <CardTitle className="text-xl text-red-600">Akses Ditolak</CardTitle>
          <CardDescription>
            Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()} // Balik ke halaman sebelumnya
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Kembali
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
