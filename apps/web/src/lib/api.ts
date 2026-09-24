const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
const TOKEN_KEY = "saas-ti:token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

type Opcoes = { method?: string; body?: unknown; query?: Record<string, string | undefined> };

export async function api<T>(path: string, { method = "GET", body, query }: Opcoes = {}): Promise<T> {
  const qs = new URLSearchParams(
    Object.entries(query ?? {}).filter((e): e is [string, string] => !!e[1]),
  ).toString();
  const token = tokenStore.get();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`, {
      method,
      headers: {
        ...(body !== undefined && { "content-type": "application/json" }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor.", 0);
  }

  if (res.status === 401 && token) {
    // sessão expirada: volta ao login
    tokenStore.clear();
    // recarga completa de propósito: zera todo o estado da sessão expirada
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
    throw new ApiError(msg ?? "Erro inesperado.", res.status);
  }
  return data as T;
}
