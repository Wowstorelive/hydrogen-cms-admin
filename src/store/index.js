import { create } from 'zustand';

export const useCMSStore = create((set) => ({
  sidebarOpen: true,
  activeView: 'dashboard',
  pages: [],
  media: [],
  currentPage: null,
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
  setPages: (pages) => set({ pages }),
  setMedia: (media) => set({ media }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  reset: () => set({
    pages: [],
    media: [],
    currentPage: null,
  }),
}));

export default useCMSStore;
