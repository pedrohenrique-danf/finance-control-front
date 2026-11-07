import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getServerEnv } from "@/lib/config/env";
import { createApiClient } from "./client";

/** Uma instância por requisição (memoização do React), repassando o cookie de sessão ao backend. */
export const getApi = cache(async () => {
  const cookieHeader = (await cookies()).toString();
  return createApiClient({
    baseUrl: getServerEnv().BACKEND_URL,
    getHeaders: () => ({ cookie: cookieHeader }),
  });
});
