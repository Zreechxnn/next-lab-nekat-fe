/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { User } from "@/types/user";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service"; // Import authService untuk getRoles
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

// 1. Schema Create: Wajib Password
const createFormSchema = z.object({
  username: z.string().min(3, "Username setidaknya terdiri dari 3 karakter."),
  password: z.string().min(6, "Password setidaknya terdiri dari 6 karakter."),
  role: z.string().min(1, "Role wajib diisi."),
});

// 2. Schema Edit: TIDAK ADA Password
const editFormSchema = z.object({
  username: z.string().min(3, "Username setidaknya terdiri dari 3 karakter."),
  role: z.string().min(1, "Role wajib diisi."),
  // Password dihapus dari sini agar tidak divalidasi/dikirim
});

// Helper type untuk form values
export type CreateFormValues = z.infer<typeof createFormSchema>;
export type EditFormValues = z.infer<typeof editFormSchema>;

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

  // 3. Setup React Hook Form
  // Kita gunakan 'any' pada useForm generic agar bisa switch antar schema,
  // atau gunakan conditional logic yang aman.
  const form = useForm<any>({
    resolver: zodResolver(isEditMode ? editFormSchema : createFormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "",
    },
  });

  // Ambil Data Role dari Backend (Opsional: jika dinamis)
  // Atau hardcode jika role statis: ['admin', 'guru', 'siswa']
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => await authService.getRoles(),
  });
  
  const roles = rolesData?.data || [
    { value: "admin", label: "Admin" },
    { value: "guru", label: "Guru" },
    { value: "siswa", label: "Siswa" }
  ];

  // Reset form saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      form.reset(); // Clear dulu
      if (initialData) {
        // Mode Edit: Isi Username & Role saja
        form.setValue("username", initialData.username);
        form.setValue("role", initialData.role);
        // Password tidak di-set
      }
    }
  }, [form, isOpen, initialData]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (isEditMode) {
        // Edit: Payload hanya { username, role }
        // Pastikan tidak mengirim password kosong
        const { password, ...payload } = values; 
        return await userService.update(String(initialData.id), payload);
      } else {
        // Create: Payload lengkap { username, password, role }
        return await userService.create(values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        `Berhasil ${isEditMode ? "mengupdate" : "membuat"} data user!`
      );
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
            {isEditMode 
              ? "Ubah data username atau role pengguna." 
              : "Masukkan kredensial untuk pengguna baru."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Field Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan username..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Password (HANYA MUNCUL SAAT CREATE) */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Input
                          type={isOpenPassword ? "text" : "password"}
                          placeholder="Masukkan password..."
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

            {/* Field Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role..." />
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

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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