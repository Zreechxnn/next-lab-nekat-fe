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
import { classService } from "@/services/class.service"; // Import Class Service
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, Shield, User as UserIcon, BookOpen } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Schema Validation
const createFormSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  role: z.string().min(1, "Role wajib diisi."),
  kelasId: z.string().optional(), // String karena value dari Select adalah string
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

export default function UserForm({ isOpen, onClose, initialData }: UserFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  const [isOpenPassword, setIsOpenPassword] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(isEditMode ? editFormSchema : createFormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "",
      kelasId: "0", // Default "0" atau string kosong untuk opsi "Tidak ada kelas"
    },
  });

  // 1. Ambil Data Roles
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => await authService.getRoles(),
    staleTime: Infinity,
  });

  // 2. AMBIL DATA KELAS (BARU)
  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => await classService.getAll(),
    enabled: isOpen, // Hanya fetch saat modal dibuka
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
        kelasId: "0"
      });

      if (initialData) {
        form.setValue("username", initialData.username);
        form.setValue("role", initialData.role);
        // Set KelasId (Convert number ke string agar terbaca Select)
        form.setValue("kelasId", initialData.kelasId ? String(initialData.kelasId) : "0");
      }
    }
  }, [form, isOpen, initialData]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      // Convert String "0" atau value select ke Number/Null untuk API
      const finalKelasId = values.kelasId && values.kelasId !== "0" ? Number(values.kelasId) : null;

      const payload = { 
        ...values, 
        kelasId: finalKelasId 
      };

      if (isEditMode) {
        const { password, ...editPayload } = payload;
        return await userService.update(Number(initialData.id), editPayload);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                <UserIcon size={24} />
            </div>
            <div>
                <DialogTitle>{isEditMode ? "Edit User" : "Tambah User Baru"}</DialogTitle>
                <DialogDescription>Kelola data akun pengguna.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 pt-2">

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: asep123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                {/* Role Selection */}
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Pilih Role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {roles.map((role: any) => (
                            <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-gray-400"/>
                                    <span className="capitalize">{role.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {/* KELAS DROPDOWN (BARU) */}
                <FormField
                control={form.control}
                name="kelasId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Kelas (Opsional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Pilih Kelas" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="0">
                                <span className="text-gray-400 italic">-- Tidak ada kelas --</span>
                            </SelectItem>
                            {classesData?.data?.map((cls: any) => (
                                <SelectItem key={cls.id} value={String(cls.id)}>
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={14} className="text-gray-400"/>
                                        <span>{cls.nama}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {/* Password */}
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
                          placeholder="Minimal 6 karakter..."
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

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Batal</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Simpan Perubahan" : "Buat User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}