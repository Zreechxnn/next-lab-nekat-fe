import { api } from "@/lib/api";

type LoginPayload = {
  username: string;
  password: string;
};

type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const login = async (loginPayload: LoginPayload) => {
  const res = await api.post("/Auth/login", loginPayload);

  return res.data;
};

const getProfile = async () => {
  const res = await api.get("/Auth/profile");

  return res.data;
};

const changePassword = async (changePasswordPayload: ChangePasswordPayload) => {
  const res = await api.post("/Auth/change-password", changePasswordPayload);

  return res.data;
};

const updateProfile = async (payload: { username: string }) => {
  const res = await api.put("/Auth/profile", payload);
  return res.data;
};

export const authService = {
  login,
  getProfile,
  changePassword,
  updateProfile,
};
