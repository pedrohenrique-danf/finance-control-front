import { z } from "zod";

// SYNC: finance-control-back/src/modules/auth/auth.factory.ts (emailAndPassword.minPasswordLength = 8;
// o Better Auth limita a 128 por padrão).
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const emailField = z.string().trim().min(1, "Informe seu e-mail.").pipe(z.email("Informe um e-mail válido."));

const newPasswordField = z
  .string()
  .min(PASSWORD_MIN, `A senha precisa de pelo menos ${PASSWORD_MIN} caracteres.`)
  .max(PASSWORD_MAX, `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`);

const confirmField = z.string().min(1, "Confirme sua senha.");

const passwordsMatch = (v: { password: string; confirm: string }) => v.password === v.confirm;
const mismatch = { path: ["confirm"], message: "As senhas não coincidem." };

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Informe sua senha."),
});
export type LoginFormValues = z.output<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(100, "Use no máximo 100 caracteres."),
    email: emailField,
    password: newPasswordField,
    confirm: confirmField,
    terms: z.boolean().refine((v) => v, "Aceite os termos para continuar."),
  })
  .refine(passwordsMatch, mismatch);
export type RegisterFormInput = z.input<typeof registerFormSchema>;
export type RegisterFormValues = z.output<typeof registerFormSchema>;

export const forgotPasswordFormSchema = z.object({ email: emailField });
export type ForgotPasswordFormValues = z.output<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({ password: newPasswordField, confirm: confirmField })
  .refine(passwordsMatch, mismatch);
export type ResetPasswordFormValues = z.output<typeof resetPasswordFormSchema>;
