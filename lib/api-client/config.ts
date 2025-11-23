import { OpenAPI } from "./core/OpenAPI";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

let configured = false;

export const configureApiClient = () => {
  if (configured) {
    return OpenAPI;
  }

  OpenAPI.BASE = DEFAULT_BASE_URL;
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

