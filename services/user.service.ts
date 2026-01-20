import { api } from "@/lib/api";

export type UserPayload = {
  username: string;
  password?: string;
  role: string;
  kelasId?: number | null; // Pastikan ini ada
};

const getAll = async () => {
  const res = await api.get("/User");
  return res.data;
};

const getById = async (id: number) => { // Ubah id jadi number agar konsisten dengan backend int
  const res = await api.get(`/User/${id}`);
  return res.data;
};

const create = async (userPayload: UserPayload) => {
  const res = await api.post("/User", userPayload);
  return res.data;
};

const update = async (id: number, userPayload: UserPayload) => { // Ubah id jadi number
  const res = await api.put(`/User/${id}`, userPayload);
  return res.data;
};

const deleteById = async (id: number) => { // Ubah id jadi number
  const res = await api.delete(`/User/${id}`);
  return res.data;
};

const getUsersWithoutCard = async () => {
  return []; 
};

export const userService = { 
  getAll, 
  create, 
  update, 
  getById, 
  deleteById,
  // getUsersWithoutCard 
};