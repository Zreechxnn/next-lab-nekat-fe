import { api } from "@/lib/api";

export type MajorPayload = {
  kode: string;
  nama: string;
};

const getAll = async () => {
  const res = await api.get("/Jurusan");
  return res.data;
};

const getById = async (id: number) => {
  const res = await api.get(`/Jurusan/${id}`);
  return res.data;
};

const create = async (payload: MajorPayload) => {
  const res = await api.post("/Jurusan", payload);
  return res.data;
};

const update = async (id: number, payload: MajorPayload) => {
  const res = await api.put(`/Jurusan/${id}`, payload);
  return res.data;
};

const deleteById = async (id: number) => {
  const res = await api.delete(`/Jurusan/${id}`);
  return res.data;
};

export const majorService = {
  getAll,
  getById,
  create,
  update,
  deleteById,
};