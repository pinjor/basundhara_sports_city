import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { TokenPairDto } from "@bsc/shared";
import { useAuthStore } from "../store/auth";

export const api = axios.create({ baseURL: "/api" });

const SESSION_ROUTES = ["/auth/login", "/auth/refresh", "/auth/logout"];

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** One refresh at a time; parallel 401s wait for the same new token. */
let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return Promise.resolve(null);
  refreshing ??= axios
    .post<TokenPairDto>("/api/auth/refresh", { refreshToken })
    .then(({ data }) => {
      useAuthStore.getState().setTokens(data);
      return data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const sessionRoute = SESSION_ROUTES.some((route) => original?.url?.startsWith(route));
    if (error.response?.status === 401 && original && !original._retried && !sessionRoute) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

/** Revokes the refresh token on the server, then clears the local session. */
export function signOut() {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (refreshToken) void axios.post("/api/auth/logout", { refreshToken }).catch(() => undefined);
  useAuthStore.getState().logout();
}
