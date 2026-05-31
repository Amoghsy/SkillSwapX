import { create } from "zustand";

export type UserType = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  location: string;
  trust: number;        // 0–100
  reputation: number;   // 0–5
  credits: number;
  streak: number;
  verified: boolean;
  mentor: boolean;
  online: boolean;
  skills: { name: string; level: 1|2|3|4|5; category: string }[];
  interests: string[];
};

export type Notification = {
  id: string;
  kind: "swap" | "credit" | "session" | "system" | "circle";
  title: string;
  body: string;
  ts: string;
  read: boolean;
};

type AppState = {
  user: UserType | null;
  notifications: Notification[];
  markAllRead: () => void;
  pushNotification: (n: Notification) => void;
  credits: number;
  addCredits: (n: number) => void;
  setUser: (user: UserType | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  setCredits: (credits: number) => void;
  /** Bump this to signal that swap data should be re-fetched everywhere */
  swapRefreshTick: number;
  bumpSwapRefresh: () => void;
};

export const useApp = create<AppState>((set) => ({
  user: null,
  notifications: [],
  markAllRead: () => set((s) => ({ notifications: s.notifications.map(n => ({...n, read:true})) })),
  pushNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications].slice(0, 30) })),
  credits: 0,
  addCredits: (n) => set((s) => ({ credits: s.credits + n })),
  setUser: (user) => set(() => ({ user, credits: user ? user.credits : 0 })),
  setNotifications: (notifications) => set(() => ({ notifications })),
  setCredits: (credits) => set(() => ({ credits })),
  swapRefreshTick: 0,
  bumpSwapRefresh: () => set((s) => ({ swapRefreshTick: s.swapRefreshTick + 1 })),
}));
