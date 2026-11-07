import { z } from "zod";

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    requestId: z.string().optional(),
  }),
});

export interface FieldIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldIssue[] | undefined;
  readonly requestId: string | undefined;

  constructor(status: number, code: string, message: string, details?: FieldIssue[], requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const { error } = errorEnvelopeSchema.parse(await res.json());
    return new ApiError(res.status, error.code, error.message, error.details, error.requestId);
  } catch {
    return new ApiError(res.status, "UNKNOWN", `Falha na requisição (HTTP ${res.status}).`);
  }
}
