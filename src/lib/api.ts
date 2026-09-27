const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3311";
const BASE = `${API_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  opts: { body?: unknown; query?: Query } = {},
): Promise<T> {
  // Files go up as raw bytes with their own type; everything else as JSON.
  const isFile = opts.body instanceof Blob;
  const res = await fetch(buildUrl(path, opts.query), {
    method,
    credentials: "include",
    headers: isFile
      ? { "Content-Type": (opts.body as Blob).type || "application/octet-stream" }
      : opts.body
        ? { "Content-Type": "application/json" }
        : undefined,
    body: isFile ? (opts.body as Blob) : opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message =
      (data && (data.message?.message ?? data.message)) || `Request failed (${res.status})`;
    const code = data?.code ?? data?.message?.code;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : message, code);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>("POST", path, { body, query }),
  patch: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>("PATCH", path, { body, query }),
  put: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>("PUT", path, { body, query }),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, { body }),
  /** POST a file as its raw bytes (the upload endpoints read the body directly). */
  upload: <T>(path: string, file: Blob) => request<T>("POST", path, { body: file }),
};
