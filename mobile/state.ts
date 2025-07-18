import { create } from 'zustand';

type User = {
  id: string;
  name: string;
};

export const useAuthStore = create<{
  isLoggedIn: boolean;
  user: User | null;
  setUser: (user: User) => void;
  setIsLoggedIn: (val: boolean) => void;
}>((set) => ({
  isLoggedIn: false,
  user: null,
  setUser: (user) => set({ user }),
  setIsLoggedIn: (val) => set({ isLoggedIn: val }),
}));

export const useScreenStore = create<{
  screen: string;
  selectedEventId: string | null;
  navigateTo: (screen: string, id?: string) => void;
}>((set) => ({
  screen: 'eventList',
  selectedEventId: null,
  navigateTo: (screen, id) => set({ screen, selectedEventId: id ?? null }),
}));

export const useEventParticipantsStore = create<{
  participants: string[];
  setParticipants: (participants: string[]) => void;
  addParticipant: (participant: string) => void;
  removeParticipant: (participant: string) => void;
}>((set, get) => ({
  participants: [],
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set({ participants: [...get().participants, participant] }),
  removeParticipant: (participant) =>
    set({
      participants: get().participants.filter((p) => p !== participant),
    }),
}));
