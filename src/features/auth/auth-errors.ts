/** Erro devolvido pelo cliente do Better Auth (`{ error }` das chamadas do authClient). */
export interface AuthClientError {
  status?: number | undefined;
  code?: string | undefined;
}

export type AuthOperation = "login" | "register" | "forgot" | "reset" | "google";

const GENERIC = "Não foi possível concluir agora. Tente novamente em instantes.";

/** Converte o erro do Better Auth em mensagem pt-BR. Login é genérico: não revela se o e-mail existe. */
export function authErrorMessage(operation: AuthOperation, error: AuthClientError): string {
  if (error.status === 429) return "Muitas tentativas seguidas. Aguarde um instante e tente de novo.";

  switch (operation) {
    case "login":
      if (error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD") return "E-mail ou senha inválidos.";
      return GENERIC;
    case "register":
      if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
        return "Não foi possível criar a conta com este e-mail. Se você já tem conta, entre ou recupere a senha.";
      }
      if (error.code === "PASSWORD_TOO_SHORT") return "A senha precisa de pelo menos 8 caracteres.";
      if (error.code === "PASSWORD_TOO_LONG") return "A senha pode ter no máximo 128 caracteres.";
      return GENERIC;
    case "forgot":
      return "Não foi possível enviar o link agora. Tente novamente mais tarde.";
    case "reset":
      if (error.code === "INVALID_TOKEN") return "Este link é inválido ou expirou. Peça um novo link.";
      return GENERIC;
    case "google":
      return "Não foi possível entrar com o Google agora. Tente novamente ou use e-mail e senha.";
  }
}
