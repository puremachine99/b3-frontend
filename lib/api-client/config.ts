import { OpenAPI } from "./core/OpenAPI";

const resolveBaseUrl = () => {
  const envBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    "http://127.0.0.1:8000";

  return envBase.replace(/\/+$/, "");
};

let configured = false;

export const configureApiClient = () => {
  if (configured) {
    return OpenAPI;
  }

  OpenAPI.BASE = resolveBaseUrl();
  OpenAPI.WITH_CREDENTIALS = false;
  OpenAPI.TOKEN = async () => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return localStorage.getItem("token") ?? undefined;
  };

  configured = true;
  return OpenAPI;
};

configureApiClient();
