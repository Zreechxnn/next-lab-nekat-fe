/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { User } from "@/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { authService } from "@/services/auth.service";

const createFormSchema = z.object({
  username: z.string().min(3, "Username setidaknya terdiri dari 3 karakter."),
  password: z.string().min(8, "Password setidaknya terdiri dari 8 karakter."),
  role: z.string().min(1, "Role wajib diisi."),
});

const editFormSchema = z.object({
  username: z.string().min(3, "Username setidaknya terdiri dari 3 karakter."),
  password: z
    .string()
    .min(8, "Password setidaknya terdiri dari 8 karakter.")
    .optional(),
  role: z.string().min(1, "Role wajib diisi."),
});

export type FormValues =
  | z.infer<typeof createFormSchema>
  | z.infer<typeof editFormSchema>;

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

  const form = useForm<FormValues>({
    resolver: zodResolver(isEditMode ? editFormSchema : createFormSchema),
    defaultValues: {
      username: initialData?.username || "",
      password: undefined,
      role: initialData?.role || "",
    },
  });

  const { data } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => await authService.getRoles(),
  });

  const roles = data?.data || [];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          username: initialData.username,
          password: undefined,
          role: initialData.role,
        });
      } else {
        form.reset();
      }
    }
  }, [form, isOpen, initialData]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditMode) {
        await userService.update(String(initialData.id), values);
      } else {
        await userService.create(values);
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

  const onSubmit = (values: FormValues) => {
  const submitValues = { ...values };
  
  if (isEditMode && !values.password) {
    delete submitValues.password;
  }

  mutation.mutate(submitValues);
};
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Tambah User"}</DialogTitle>
          <DialogDescription>
            Masukkan detail user untuk di {isEditMode ? "edit" : "buat"}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Masukkan username..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      {isOpenPassword ? (
                        <EyeOff
                          className="absolute top-2 right-2"
                          onClick={() => setIsOpenPassword(false)}
                        />
                      ) : (
                        <Eye
                          className="absolute top-2 right-2"
                          onClick={() => setIsOpenPassword(true)}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  {isEditMode && (
                    <FormDescription>
                      Kosongkan bila tidak ingin diubah.
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
