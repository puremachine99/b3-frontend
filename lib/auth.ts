import "@/lib/api-client/config";
import { ApiError, AuthService } from "@/lib/api-client";
import type { LoginDto } from "@/lib/api-client";

export async function login(email: string, password: string) {
  const payload: LoginDto = { email, password };
  try {
    const res = await AuthService.authControllerLogin(payload);
    const token = res?.access_token;
    const user = res?.user;

    if (!token) throw new Error("Token tidak ditemukan di response");

    localStorage.setItem("token", token);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    // Also set a cookie so Next.js middleware can detect the session on the server
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    return { token, user };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error("Login gagal");
  }
}
