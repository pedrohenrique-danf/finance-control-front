import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  BACKEND_URL: z.url(),
});

let cached: z.output<typeof serverSchema> | undefined;

/** Lê e valida as variáveis de servidor uma vez (configuração imutável da aplicação). */
export function getServerEnv(): z.output<typeof serverSchema> {
  cached ??= (() => {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      const lines = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`);
      throw new Error(`Variáveis de ambiente inválidas:\n${lines.join("\n")}`);
    }
    return parsed.data;
  })();
  return cached;
}
