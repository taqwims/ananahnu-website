import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    setAuth: (user: User, token: string, refreshToken: string) => void;
    updateUser: (data: Partial<User>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
            updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
            logout: () => set({ user: null, token: null, refreshToken: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
