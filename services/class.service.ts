import { api } from "@/lib/api";

type CreateClassPayload = {
  nama: string;
};

const getAll = async () => {
  const res = await api.get("/Kelas");

  return res.data;
};

const create = async (createPayload: CreateClassPayload) => {
  const res = await api.post("/Kelas", createPayload);

  return res.data;
};

const getById = async (id: string) => {
  const res = await api.get(`/Kelas/${id}`);

  return res.data;
};

const update = async (id: string, updatePayload: CreateClassPayload) => {
  const res = await api.put(`/Kelas/${id}`, updatePayload);

  return res.data;
};

const deleteById = async (id: string) => {
  const res = await api.delete(`/Kelas/${id}`);

  return res.data;
};

export const classService = {
  getAll,
  create,
  getById,
  update,
  deleteById,
};
