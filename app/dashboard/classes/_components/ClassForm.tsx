/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
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
import { api } from "@/lib/api";

// Schema validasi
const formSchema = z.object({
  nama: z.string().min(1, "Nama Kelas wajib diisi."),
  periodeId: z.string().min(1, "Periode wajib dipilih."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ClassForm({ isOpen, onClose, initialData }: any) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  // Ambil data periode untuk dropdown
  const { data: periods } = useQuery({
    queryKey: ["periods"],
    queryFn: async () => {
      const res = await api.get("/Periode");
      return res.data;
    },
    enabled: isOpen,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      periodeId: "",
    },
  });

  // Reset form saat modal dibuka/tutup atau ganti data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.setValue("nama", initialData.nama);
        form.setValue("periodeId", String(initialData.periodeId));
      } else {
        form.reset({ nama: "", periodeId: "" });
      }
    }
  }, [isOpen, initialData, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        nama: values.nama,
        periodeId: Number(values.periodeId),
      };

      if (isEditMode) {
        return await classService.update(String(initialData.id), payload);
      } else {
        return await classService.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(`Kelas berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}!`);
      onClose();
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.message || "Terjadi kesalahan.");
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle>
          <DialogDescription>
            Isi detail kelas dan pilih periode tahun ajaran.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelas</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 10PPLG1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Periode</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Periode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periods?.data?.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? <Spinner className="mr-2" /> : null}
                {isEditMode ? "Simpan Perubahan" : "Tambah Kelas"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}