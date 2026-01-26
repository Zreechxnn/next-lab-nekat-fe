"use client";
import { authService } from "@/services/auth.service";
import { User } from "@/types/user";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { createSignalRConnection } from "@/lib/signalr";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";

export type LoginPayload = {
  username: string;
  password: string;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signalrConnection: HubConnection | null;

  login: (user: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
  initializeSignalR: () => Promise<void>;
  cleanupSignalR: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signalrConnection: null,

  login: async (data) => {
    try {
      toast.loading("Loading...", { id: "login" });
      const res = await authService.login(data);

      localStorage.setItem("authToken", res.data.token);
      
      const userData = { ...res.data };
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });

      // Initialize SignalR setelah login sukses
      await get().initializeSignalR();
      
      toast.success("Login berhasil!");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data.message || "Terjadi kesalahan saat login!"
        );

        if (err.response?.status === 401) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        toast.error("Terjadi kesalahan saat login!");
      }
    } finally {
      toast.dismiss("login");
    }
  },

  logout: async () => {
    try {
      toast.loading("Melakukan logout...", { id: "logout" });
      
      // Cleanup SignalR connection
      get().cleanupSignalR();
      
      // Hapus token
      localStorage.removeItem("authToken");
      toast.success("Logout berhasil!");
    } catch (err) {
      console.error(err);
      toast.dismiss("logout");
    } finally {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        signalrConnection: null 
      });
      toast.dismiss("logout");
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await authService.getProfile();
      const userData = res.data;

      set({ 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false 
      });

      // Initialize SignalR setelah check auth
      await get().initializeSignalR();
      
      return true;
    } catch (err) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
      return false;
    }
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  initializeSignalR: async () => {
    const token = localStorage.getItem("authToken");
    if (!token || get().signalrConnection) return;

    try {
      const connection = createSignalRConnection(token);
      
      await connection.start();
      console.log("✅ SignalR connected for auth store");

      // Handler untuk update user dari mana saja (my-profile ATAU admin page)
      const handleUserUpdate = (payload: any) => {
        const rawType = payload.eventType || payload.EventType || payload.type || "";
        const eventType = rawType.toUpperCase();
        const data = payload.data || payload.Data;
        
        console.log("🔄 SignalR User Update Received (Auth Store):", eventType, data);

        // Tangkap SEMUA update user, termasuk dari halaman admin
        const currentUser = get().user;
        if (currentUser && data && data.id === currentUser.id) {
          if (eventType === "USER_UPDATED") {
            // **UPDATE LENGKAP**: Update semua field yang mungkin berubah
            const updatedUser = {
              ...currentUser,
              username: data.username || currentUser.username,
              role: data.role || currentUser.role,
              kelasId: data.kelasId !== undefined ? data.kelasId : currentUser.kelasId,
              kelasNama: data.kelasNama || currentUser.kelasNama,
              kartuUid: data.kartuUid || currentUser.kartuUid,
              kartuId: data.kartuId || currentUser.kartuId,
            };
            
            // Update store dengan data lengkap
            set({ user: updatedUser });
            
            // Beri feedback visual
            if (data.username && data.username !== currentUser.username) {
              toast.info(`Username anda diperbarui: ${data.username}`);
            }
            if (data.role && data.role !== currentUser.role) {
              toast.info(`Role anda diperbarui: ${data.role}`);
            }
          }
        }
        
        // Tangkap juga event dari my-profile (self-update) jika ada
        if (eventType === "PROFILE_UPDATED" && data) {
          const currentUser = get().user;
          if (currentUser && data.id === currentUser.id) {
            set({
              user: {
                ...currentUser,
                username: data.username || currentUser.username
              }
            });
            toast.info(`Profil diperbarui: ${data.username}`);
          }
        }
      };

      // Listen to semua kemungkinan nama event
      connection.on("UserNotification", handleUserUpdate);
      connection.on("usernotification", handleUserUpdate);
      connection.on("ProfileUpdated", handleUserUpdate);
      connection.on("profileupdated", handleUserUpdate);
      
      // Handler untuk error/connection events
      connection.onclose((error) => {
        console.error("SignalR connection closed:", error);
      });
      
      connection.onreconnecting((error) => {
        console.log("SignalR reconnecting:", error);
      });
      
      connection.onreconnected((connectionId) => {
        console.log("SignalR reconnected:", connectionId);
      });

      set({ signalrConnection: connection });
    } catch (err) {
      console.error("❌ Failed to initialize SignalR:", err);
    }
  },

  cleanupSignalR: () => {
    const connection = get().signalrConnection;
    if (connection && connection.state === HubConnectionState.Connected) {
      connection.stop().catch(console.error);
    }
    set({ signalrConnection: null });
  },
}));