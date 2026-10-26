import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUserDto, TokenPairDto } from "@bsc/shared";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUserDto | null;
  setSession: (tokens: TokenPairDto, user: AuthUserDto) => void;
  setTokens: (tokens: TokenPairDto) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setSession: (tokens, user) => set({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      setTokens: (tokens) => set({ token: tokens.accessToken, refreshToken: tokens.refreshToken }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: "bsc-auth" },
  ),
);
