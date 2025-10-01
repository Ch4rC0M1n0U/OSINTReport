import axios, { type AxiosError } from "axios";

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
      // eslint-disable-next-line no-console
      console.warn("Session expirée ou non authentifiée");
    }
    return Promise.reject(error);
  }
);
