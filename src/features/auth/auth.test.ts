import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-errors";
import { passwordStrength } from "./password-strength";
import { loginFormSchema, registerFormSchema, resetPasswordFormSchema } from "./schemas";

describe("passwordStrength", () => {
  it.each([
    ["", 0],
    ["abc", 1],
    ["abcdefgh", 1],
    ["Abcdefgh", 2],
    ["Abcdefg1", 3],
    ["Abcdef1!", 4],
  ] as const)("%j → %i", (input, expected) => {
    expect(passwordStrength(input)).toBe(expected);
  });
});

describe("schemas de autenticação", () => {
  it("login exige e-mail válido e senha", () => {
    const result = loginFormSchema.safeParse({ email: "x", password: "" });
    expect(result.success).toBe(false);
    expect(loginFormSchema.parse({ email: "  a@b.com ", password: "1" })).toEqual({ email: "a@b.com", password: "1" });
  });

  const valid = {
    name: "Ana",
    email: "ana@exemplo.com",
    password: "Senha-segura-1",
    confirm: "Senha-segura-1",
    terms: true,
  };

  it("cadastro válido passa", () => {
    expect(registerFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ password: "curta", confirm: "curta" }, "password"],
    [{ confirm: "outra-senha" }, "confirm"],
    [{ terms: false }, "terms"],
    [{ name: " " }, "name"],
  ])("cadastro rejeita %j no campo %s", (patch, path) => {
    const result = registerFormSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join("."))).toContain(path);
  });

  it("nova senha exige confirmação igual", () => {
    expect(resetPasswordFormSchema.safeParse({ password: "12345678", confirm: "12345679" }).success).toBe(false);
    expect(resetPasswordFormSchema.safeParse({ password: "12345678", confirm: "12345678" }).success).toBe(true);
  });
});

describe("authErrorMessage", () => {
  it("login não revela se o e-mail existe", () => {
    expect(authErrorMessage("login", { status: 401, code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "E-mail ou senha inválidos.",
    );
  });

  it("trata limite de tentativas em qualquer operação", () => {
    expect(authErrorMessage("register", { status: 429 })).toMatch(/Muitas tentativas/);
  });

  it("cadastro com e-mail existente sugere entrar ou recuperar", () => {
    expect(authErrorMessage("register", { status: 422, code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toMatch(
      /recupere a senha/,
    );
  });

  it("token de redefinição inválido", () => {
    expect(authErrorMessage("reset", { status: 400, code: "INVALID_TOKEN" })).toMatch(/inválido ou expirou/);
  });
});
