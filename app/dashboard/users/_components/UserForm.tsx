/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { User } from "@/types/user";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Schema Validation
// kelasId tetap ada di schema tapi opsional, UI-nya disembunyikan
const createFormSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  role: z.string().min(1, "Role wajib diisi."),
  kelasId: z.string().optional(),
});

const editFormSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter."),
  role: z.string().min(1, "Role wajib diisi."),
  kelasId: z.string().optional(),
});

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: User | null;
}

export default function UserForm({
  isOpen,
  onClose,
  initialData,
}: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  const [isOpenPassword, setIsOpenPassword] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(isEditMode ? editFormSchema : createFormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "",
      kelasId: "no-class",
    },
  });

  // 1. Ambil Data Roles
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => await authService.getRoles(),
    staleTime: Infinity,
  });

  const roles = rolesData?.data || [
    { value: "admin", label: "Admin" },
    { value: "guru", label: "Guru" },
    { value: "siswa", label: "Siswa" },
    { value: "operator", label: "Operator" }
  ];

  // Reset & Populate Form
  useEffect(() => {
    if (isOpen) {
      form.reset({
        username: "",
        password: "",
        role: "",
        kelasId: "no-class"
      });

      if (initialData) {
        form.setValue("username", initialData.username);
        form.setValue("role", initialData.role);
        // Tetap set value jika ada, tapi UI tidak muncul
        form.setValue("kelasId", initialData.kelasId ? String(initialData.kelasId) : "no-class");
      }
    }
  }, [form, isOpen, initialData]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      // Default null karena UI disembunyikan
      const finalKelasId = null;

      const payload = {
        ...values,
        kelasId: finalKelasId
      };

      if (isEditMode) {
        const { password, ...editPayload } = payload;
        return await userService.update(String(initialData.id), editPayload);
      } else {
        return await userService.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Berhasil ${isEditMode ? "mengupdate" : "membuat"} user!`);
      onClose();
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.message || "Terjadi kesalahan!");
      }
    },
  });

  const onSubmit = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Tambah User"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Ubah data pengguna." : "Tambah pengguna baru ke dalam sistem."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password (Create Mode Only) */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={isOpenPassword ? "text" : "password"}
                          placeholder="Password..."
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setIsOpenPassword(!isOpenPassword)}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                          {isOpenPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Role (Full Width sekarang karena kelas dihapus) */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role: any) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* FIELD KELAS DISEMBUNYIKAN */}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Simpan" : "Buat User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}