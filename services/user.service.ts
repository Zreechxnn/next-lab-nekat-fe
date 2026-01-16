import { api } from "@/lib/api";

// Update tipe payload
export type UserPayload = {
  username: string;
  password?: string;
  role: string;
  kelasId?: number | null; // Tambahkan ini
};

const getAll = async () => {
  const res = await api.get("/User");
  return res.data;
};

const create = async (userPayload: UserPayload) => {
  const res = await api.post("/User", userPayload);
  return res.data;
};

const update = async (id: string, userPayload: UserPayload) => {
  const res = await api.put(`/User/${id}`, userPayload);
  return res.data;
};

const getById = async (id: string) => {
  const res = await api.get(`/User/${id}`);
  return res.data;
};

const deleteById = async (id: string) => {
  const res = await api.delete(`/User/${id}`);
  return res.data;
};

export const userService = { getAll, create, update, getById, deleteById };