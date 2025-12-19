import { api } from "@/lib/api";

const getAll = async () => {
  const res = await api.get("/Periode");
  return res.data;
};

const create = async (payload: { nama: string; isAktif: boolean }) => {
  const res = await api.post("/Periode", payload);
  return res.data;
};

const deleteById = async (id: number) => {
  const res = await api.delete(`/Periode/${id}`);
  return res.data;
};

export const periodService = { getAll, create, deleteById };