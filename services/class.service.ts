import { api } from "@/lib/api";

export type ClassPayload = {
  nama: string;
  tingkat: number;
  jurusanId: number;
  periodeId: number;
};

const getAll = async () => {
  const res = await api.get("/Kelas");
  return res.data;
};

const getById = async (id: number) => {
  const res = await api.get(`/Kelas/${id}`);
  return res.data;
};

const create = async (payload: ClassPayload) => {
  const res = await api.post("/Kelas", payload);
  return res.data;
};

const update = async (id: number, payload: ClassPayload) => {
  const res = await api.put(`/Kelas/${id}`, payload);
  return res.data;
};

const deleteById = async (id: string) => {
  const res = await api.delete(`/Kelas/${id}`);
  return res.data;
};

const getByJurusan = async (jurusanId: number) => {
  const res = await api.get(`/Kelas/jurusan/${jurusanId}`);
  return res.data;
};

const getByJurusanAndTingkat = async (jurusanId: number, tingkat: number) => {
  const res = await api.get(`/Kelas/jurusan/${jurusanId}/tingkat/${tingkat}`);
  return res.data;
};

const getStats = async (id: number) => {
  const res = await api.get(`/Kelas/stats/${id}`);
  return res.data;
};

export const classService = {
  getAll,
  getById,
  create,
  update,
  deleteById,
  getByJurusan,
  getByJurusanAndTingkat,
  getStats,
};