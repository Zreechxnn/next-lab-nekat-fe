import { api } from "@/lib/api";

export type ClassPayload = {
  nama: string;
  periodeId: number;
};

const getAll = async () => {
  const res = await api.get("/Kelas");
  return res.data;
};

const create = async (payload: ClassPayload) => {
  const res = await api.post("/Kelas", payload);
  return res.data;
};

const update = async (id: string, payload: ClassPayload) => {
  const res = await api.put(`/Kelas/${id}`, payload);
  return res.data;
};

const deleteById = async (id: string) => {
  const res = await api.delete(`/Kelas/${id}`);
  return res.data;
};

export const classService = {
  getAll,
  create,
  update,
  deleteById,
};