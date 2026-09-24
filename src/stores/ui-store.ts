import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  /** Sidebar sections folded away, by label ("Money", "Setup"). */
  collapsedNavGroups: string[];
  mobileSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleNavGroup: (label: string) => void;
  expandNavGroup: (label: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      collapsedNavGroups: [],
      mobileSidebarOpen: false,
      theme: 'light',

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleNavGroup: (label) =>
        set((state) => ({
          collapsedNavGroups: state.collapsedNavGroups.includes(label)
            ? state.collapsedNavGroups.filter((l) => l !== label)
            : [...state.collapsedNavGroups, label],
        })),

      expandNavGroup: (label) =>
        set((state) =>
          state.collapsedNavGroups.includes(label)
            ? { collapsedNavGroups: state.collapsedNavGroups.filter((l) => l !== label) }
            : state,
        ),

      setMobileSidebarOpen: (open) =>
        set({ mobileSidebarOpen: open }),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        collapsedNavGroups: state.collapsedNavGroups,
        theme: state.theme,
      }),
      // Same reason as the auth store: a collapsed rail read from localStorage
      // during import renders `w-[68px]` against the server's `w-64`, and the
      // group labels disappear. See the note there; `StoreHydration` replays it.
      skipHydration: true,
    },
  ),
);
