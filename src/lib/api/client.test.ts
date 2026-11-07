import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApiClient } from "./client";

const itemSchema = z.object({ id: z.string() });

const respond = (body: BodyInit | null, status: number, contentType = "application/json") =>
  (async () => new Response(body, { status, headers: { "Content-Type": contentType } })) as unknown as typeof fetch;

describe("createApiClient", () => {
  it("valida a resposta de sucesso com Zod", async () => {
    const api = createApiClient({ baseUrl: "", fetchFn: respond(JSON.stringify({ id: "1" }), 200) });
    await expect(api.get("/x", itemSchema)).resolves.toEqual({ id: "1" });
  });

  it("converte envelope de erro em ApiError", async () => {
    const body = JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: [{ path: "name", message: "Obrigatório." }],
      },
    });
    const api = createApiClient({ baseUrl: "", fetchFn: respond(body, 400) });
    await expect(api.post("/api/v1/categories", {}, itemSchema)).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      details: [{ path: "name" }],
    });
  });

  it("trata erro sem JSON", async () => {
    const api = createApiClient({ baseUrl: "", fetchFn: respond("Bad Gateway", 502, "text/plain") });
    await expect(api.get("/x", itemSchema)).rejects.toMatchObject({ status: 502, code: "UNKNOWN" });
  });

  it("aceita 204 sem corpo na exclusão", async () => {
    const api = createApiClient({ baseUrl: "", fetchFn: respond(null, 204) });
    await expect(api.delete("/api/v1/categories/1")).resolves.toBeUndefined();
  });

  it("monta query string ignorando valores indefinidos", async () => {
    let calledUrl = "";
    const fetchFn = (async (url: string) => {
      calledUrl = url;
      return new Response(JSON.stringify({ id: "1" }), { status: 200 });
    }) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: "http://api", fetchFn });
    await api.get("/x", itemSchema, { month: "2026-11", page: 2, pageSize: undefined });
    expect(calledUrl).toBe("http://api/x?month=2026-11&page=2");
  });
});
