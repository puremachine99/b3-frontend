import axios from "axios";
import { api } from "./api";

export async function login(email: string, password: string) {
  try {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.access_token;
    const user = res.data.user;

    if (!token) throw new Error("Token tidak ditemukan di response");

    localStorage.setItem("token", token);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    // Also set a cookie so Next.js middleware can detect the session on the server
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    return { token, user };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "Login gagal";
      throw new Error(
        Array.isArray(message) ? message.join(", ") : String(message)
      );
    }
    throw new Error("Login gagal");
  }
}
