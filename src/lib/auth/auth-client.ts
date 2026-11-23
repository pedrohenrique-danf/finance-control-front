"use client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Mesma origem: usa /api/auth via rewrites para o backend.
 * Campos extras do usuário no backend: `termsVersion` (enviado no cadastro) e `termsAcceptedAt` (só o servidor grava).
 */
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        termsVersion: { type: "string", required: false },
        termsAcceptedAt: { type: "date", required: false, input: false },
      },
    }),
  ],
});
