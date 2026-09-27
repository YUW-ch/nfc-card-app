"use client";

import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { emailOTPClient } from "better-auth/client/plugins";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3311";

/**
 * better-auth web client. Talks to the NestJS backend's catch-all auth handler
 * mounted at /api/v1/auth. Sessions are cookie-based (same-site: app.taplino.ch
 * ↔ api.taplino.ch), so every request includes credentials.
 */
export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/v1/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [passkeyClient(), emailOTPClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
