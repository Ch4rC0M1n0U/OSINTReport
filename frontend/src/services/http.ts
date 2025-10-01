import axios, { type AxiosError } from "axios";

let isHandlingUnauthorized = false;

async function handleUnauthorized() {
  if (isHandlingUnauthorized) return;

  isHandlingUnauthorized = true;

  try {
    const { useAuthStore } = await import("@/stores/auth");
    const auth = useAuthStore();
    auth.clearSession();

    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    const isLoginRoute = window.location.pathname.startsWith("/login");

    if (!isLoginRoute) {
      const redirectParam = encodeURIComponent(currentPath);
      window.location.href = `/login?redirect=${redirectParam}`;
    }
  } finally {
    isHandlingUnauthorized = false;
  }
}

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : `${window.location.origin.replace(/\/$/, "")}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as AxiosError | undefined;

    if (axiosError?.response?.status === 401) {
      void handleUnauthorized();
    }
    return Promise.reject(error);
  }
);
