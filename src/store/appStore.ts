import { create } from "zustand";

export type Page =
  | "dashboard"
  | "members"
  | "seats"
  | "floors"
  | "sections"
  | "payments"
  | "settings"
  | "whatsapp";

interface AppState {
  currentPage: Page;
  sidebarOpen: boolean;
  isAuthenticated: boolean;
  setCurrentPage: (page: Page) => void;
  setSidebarOpen: (open: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  sidebarOpen: false,
  isAuthenticated: false,
  setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
}));