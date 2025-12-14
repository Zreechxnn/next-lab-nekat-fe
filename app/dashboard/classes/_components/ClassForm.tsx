/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { User } from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
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

const formSchema = z.object({
  nama: z.string().min(1, "Nama Kelas wajib diisi."),
});

export type FormValues = z.infer<typeof formSchema>;

interface ClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null;
}

export default function ClassForm({
  isOpen,
  onClose,
  initialData,
}: ClassFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.setValue("nama", initialData.nama);
      } else {
        form.reset();
      }
    }
  }, [form, isOpen, initialData]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditMode) {
        await classService.update(String(initialData.id), values);
      } else {
        await classService.create(values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(
        `Berhasil ${isEditMode ? "mengupdate" : "membuat"} data kelas!`
      );
      onClose();
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.message || "Terjadi kesalahan!");
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
          <DialogTitle>
            {isEditMode ? "Edit Kelas" : "Tambah Kelas"}
          </DialogTitle>
          <DialogDescription>
            Masukkan detail kelas untuk di {isEditMode ? "edit" : "buat"}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelas</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Masukkan nama kelas..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                {mutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
