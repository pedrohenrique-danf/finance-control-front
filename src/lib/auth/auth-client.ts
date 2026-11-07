"use client";
import { createAuthClient } from "better-auth/react";

/** Mesma origem: usa /api/auth via rewrites para o backend. */
export const authClient = createAuthClient();
