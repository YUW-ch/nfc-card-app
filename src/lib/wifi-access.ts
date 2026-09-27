import { api, apiUrl } from "@/lib/api";
import type { WifiAccessClient, WifiAccessResult } from "@/components/public/WifiView";

const clients = new Map<string, WifiAccessClient>();

/**
 * The public Wi-Fi endpoints for one page. Cached per slug so the object stays
 * stable across renders (the view restores a returning guest once per client).
 */
export function wifiAccessClient(slug: string): WifiAccessClient {
  let client = clients.get(slug);
  if (client) return client;
  const base = `/public/pages/${slug}/wifi`;
  client = {
    storageKey: `taplino.wifi.${slug}`,
    request: (input) => api.post<WifiAccessResult>(`${base}/access`, input),
    verify: (email, code) => api.post<WifiAccessResult>(`${base}/verify`, { email, code }),
    credentials: (token) => api.get<{ password: string | null }>(`${base}/credentials`, { token }),
    profileUrl: (token) =>
      apiUrl(`${base}/profile.mobileconfig${token ? `?token=${encodeURIComponent(token)}` : ""}`),
  };
  clients.set(slug, client);
  return client;
}
