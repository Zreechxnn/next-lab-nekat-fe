/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { classService } from "@/services/class.service";
import { majorService } from "@/services/major.service";
import { periodService } from "@/services/period.service";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

// --- SCHEMA FORM KELAS ---
const formSchema = z.object({
  periodeId: z.string().min(1, "Periode wajib dipilih."),
  jurusanId: z.string().min(1, "Jurusan wajib dipilih."),
  tingkat: z.string().min(1, "Tingkat wajib dipilih."),
  suffix: z.string().min(1, "Identitas kelas wajib diisi."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ClassForm({ isOpen, onClose, initialData }: any) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  const [previewName, setPreviewName] = useState("");

  // --- STATE MODALS (Hanya untuk Tambah) ---
  const [isAddMajorOpen, setIsAddMajorOpen] = useState(false);
  const [newMajor, setNewMajor] = useState({ kode: "", nama: "" });

  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");

  // --- QUERIES ---
  const { data: periods } = useQuery({
    queryKey: ["periods"],
    queryFn: periodService.getAll,
    enabled: isOpen,
  });

  const { data: majorsData, isLoading: isLoadingMajors } = useQuery({
    queryKey: ["majors"],
    queryFn: majorService.getAll,
    enabled: isOpen,
  });

  const majorsList = Array.isArray(majorsData) 
    ? majorsData 
    : (Array.isArray(majorsData?.data) ? majorsData.data : []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { periodeId: "", jurusanId: "", tingkat: "", suffix: "" },
  });

  // --- WATCHERS & PREVIEW ---
  const watchedJurusanId = form.watch("jurusanId");
  const watchedTingkat = form.watch("tingkat");
  const watchedSuffix = form.watch("suffix");

  useEffect(() => {
    if (majorsList.length > 0 && watchedJurusanId && watchedTingkat && watchedSuffix) {
      const selectedMajor = majorsList.find((m: any) => String(m.id) === watchedJurusanId);
      if (selectedMajor) {
        setPreviewName(`${watchedTingkat} ${selectedMajor.kode} ${watchedSuffix.toUpperCase()}`);
      }
    } else {
      setPreviewName("");
    }
  }, [watchedJurusanId, watchedTingkat, watchedSuffix, majorsList]);

  // --- RESET FORM ---
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.setValue("periodeId", String(initialData.periodeId));
        form.setValue("jurusanId", String(initialData.jurusanId || ""));
        form.setValue("tingkat", String(initialData.tingkat || ""));
        const parts = initialData.nama.split(" ");
        if (parts.length > 2) form.setValue("suffix", parts[parts.length - 1]);
      } else {
        form.reset({ periodeId: "", jurusanId: "", tingkat: "", suffix: "" });
        setPreviewName("");
      }
    }
  }, [isOpen, initialData, form]);

  // ==========================
  //      MUTATIONS
  // ==========================

  // 1. Create/Edit KELAS
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const selectedMajor = majorsList.find((m: any) => String(m.id) === values.jurusanId);
      const finalName = `${values.tingkat} ${selectedMajor?.kode} ${values.suffix.toUpperCase()}`;
      const payload = {
        nama: finalName,
        periodeId: Number(values.periodeId),
        jurusanId: Number(values.jurusanId),
        tingkat: Number(values.tingkat),
      };
      return isEditMode 
        ? await classService.update(Number(initialData.id), payload)
        : await classService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(`Kelas berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}!`);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data.message || "Gagal menyimpan kelas."),
  });

  // 2. Create JURUSAN
  const addMajorMutation = useMutation({
    mutationFn: async () => {
      if (!newMajor.kode || !newMajor.nama) throw new Error("Wajib diisi");
      return await majorService.create(newMajor);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      toast.success("Jurusan ditambahkan");
      if (res.data?.id) form.setValue("jurusanId", String(res.data.id));
      setIsAddMajorOpen(false); setNewMajor({ kode: "", nama: "" });
    },
    onError: () => toast.error("Gagal menambah jurusan"),
  });

  // 3. Create PERIODE
  const addPeriodMutation = useMutation({
    mutationFn: async () => {
      if (!newPeriodName) throw new Error("Wajib diisi");
      return await periodService.create({ nama: newPeriodName, isAktif: false });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
      toast.success("Periode ditambahkan");
      if (res.data?.id) form.setValue("periodeId", String(res.data.id));
      setIsAddPeriodOpen(false); setNewPeriodName("");
    },
    onError: () => toast.error("Gagal menambah periode"),
  });

  return (
    <>
      {/* --- FORM UTAMA --- */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Kelas" : "Kelola Kelas"}</DialogTitle>
            <DialogDescription>Tambah/Edit kelas, jurusan, dan tahun ajaran.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              
              {/* PERIODE DROPDOWN */}
              <FormField
                control={form.control}
                name="periodeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Ajaran</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih Tahun Ajaran" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Tombol Tambah Periode */}
                        <div 
                            className="p-2 border-b border-gray-100 mb-1 sticky top-0 bg-white z-10 cursor-pointer hover:bg-indigo-50 flex items-center text-indigo-600 font-medium text-sm rounded-sm"
                            onPointerDown={(e) => {
                                e.preventDefault();
                                setIsAddPeriodOpen(true);
                            }}
                        >
                            <Plus size={16} className="mr-2" /> Tambah Tahun Ajaran
                        </div>

                        {/* List Periode (Tanpa Tombol Hapus) */}
                        {periods?.data?.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nama} {p.isAktif && "(Aktif)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                  {/* JURUSAN DROPDOWN */}
                  <FormField
                  control={form.control}
                  name="jurusanId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Jurusan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingMajors}>
                          <FormControl>
                          <SelectTrigger><SelectValue placeholder={isLoadingMajors ? "Loading..." : "Pilih Jurusan"} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Tombol Tambah Jurusan */}
                            <div 
                                className="p-2 border-b border-gray-100 mb-1 sticky top-0 bg-white z-10 cursor-pointer hover:bg-indigo-50 flex items-center text-indigo-600 font-medium text-sm rounded-sm"
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    setIsAddMajorOpen(true);
                                }}
                            >
                                <Plus size={16} className="mr-2" /> Tambah Jurusan
                            </div>

                            {/* List Jurusan (Tanpa Tombol Hapus) */}
                            {majorsList.length > 0 ? (
                                majorsList.map((m: any) => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                        <span className="font-bold mr-1">{m.kode}</span>
                                        <span className="text-xs text-gray-500 truncate max-w-[120px] inline-block align-bottom">- {m.nama}</span>
                                    </SelectItem>
                                ))
                            ) : <div className="p-2 text-center text-sm text-gray-500">Data kosong</div>}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />

                  {/* TINGKAT DROPDOWN */}
                  <FormField
                  control={form.control}
                  name="tingkat"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Tingkat</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                          <SelectContent>
                              {[10, 11, 12, 13].map(t => (
                                <SelectItem key={t} value={String(t)}>Kelas {t}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>

              {/* SUFFIX */}
              <FormField
                control={form.control}
                name="suffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identitas (1, 2, A, B)</FormLabel>
                    <FormControl><Input placeholder="Contoh: 1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-center">
                  <p className="text-xs text-indigo-600 font-semibold uppercase mb-1">Preview</p>
                  <div className="text-lg font-bold text-indigo-900">{previewName || "-"}</div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600">
                  {mutation.isPending ? <Spinner className="mr-2" /> : null} {isEditMode ? "Simpan" : "Buat Kelas"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: TAMBAH JURUSAN --- */}
      <Dialog open={isAddMajorOpen} onOpenChange={setIsAddMajorOpen}>
        <DialogContent className="sm:max-w-[400px] z-[9998]">
            <DialogHeader><DialogTitle>Tambah Jurusan</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
                <div><Label>Kode</Label><Input placeholder="RPL" value={newMajor.kode} onChange={(e) => setNewMajor({...newMajor, kode: e.target.value.toUpperCase()})}/></div>
                <div><Label>Nama Lengkap</Label><Input placeholder="Rekayasa Perangkat Lunak" value={newMajor.nama} onChange={(e) => setNewMajor({...newMajor, nama: e.target.value})}/></div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMajorOpen(false)}>Batal</Button>
                <Button onClick={() => addMajorMutation.mutate()} disabled={addMajorMutation.isPending}>Simpan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: TAMBAH PERIODE --- */}
      <Dialog open={isAddPeriodOpen} onOpenChange={setIsAddPeriodOpen}>
        <DialogContent className="sm:max-w-[400px] z-[9998]">
            <DialogHeader><DialogTitle>Tambah Tahun Ajaran</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
                <div><Label>Tahun</Label><Input placeholder="2025/2026" value={newPeriodName} onChange={(e) => setNewPeriodName(e.target.value)}/></div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPeriodOpen(false)}>Batal</Button>
                <Button onClick={() => addPeriodMutation.mutate()} disabled={addPeriodMutation.isPending}>Simpan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}