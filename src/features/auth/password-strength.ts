export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * Pontuação simples para o medidor do cadastro (só UX, não é política de senha):
 * comprimento ≥ 8, maiúsculas e minúsculas, dígito e símbolo. Vazio → 0; preenchido → no mínimo 1.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.max(1, score) as PasswordStrength;
}

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  0: "",
  1: "Fraca",
  2: "Razoável",
  3: "Boa",
  4: "Forte",
};
