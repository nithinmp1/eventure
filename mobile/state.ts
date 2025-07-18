import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isLoggedIn: false,
  user: null,
  setUser: (user: any) => set({ user }),
  setIsLoggedIn: (val: boolean) => set({ isLoggedIn: val }),
}));

export const useScreenStore = create((set) => ({
  screen: 'eventList',
  selectedEventId: null,
  navigateTo: (screen: string, id?: string) =>
    set({ screen, selectedEventId: id }),
}));
