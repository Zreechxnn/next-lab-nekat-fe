import { api } from "@/lib/api";

const getAll = async () => {
  const res = await api.get("/Aktivitas");
  return res.data;
};

const getById = async (id: string) => {
  const res = await api.get(`/Aktivitas/${id}`);
  return res.data;
};

const deleteById = async (id: string) => {
  const res = await api.delete(`/Aktivitas/${id}`);
  return res.data;
};

const deleteAll = async () => {
  const res = await api.delete("/Aktivitas/all");
  return res.data;
};

export const activityService = { getAll, getById, deleteById, deleteAll };