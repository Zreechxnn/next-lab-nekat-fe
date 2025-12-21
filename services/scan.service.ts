import { api } from "@/lib/api";

const register = async (uid: string) => {
  const res = await api.post("/Scan/register", { uid });
  return res.data;
};

const getLatest = async () => {
  const res = await api.get("/Scan/latest");
  return res.data;
};

export const scanService = {
  register,
  getLatest,
};