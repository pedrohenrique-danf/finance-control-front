/**
 * Versão vigente dos termos de uso e da política de privacidade (data da publicação). Deve ser igual a
 * TERMS_VERSION do backend (src/modules/auth/terms.ts): o cadastro envia esta versão e o backend recusa outra.
 */
export const TERMS_VERSION = "2026-11-23";

/** Data da versão, por extenso, para o topo das páginas. */
export const TERMS_UPDATED_AT = "23 de novembro de 2026";

/**
 * E-mail para pedidos sobre dados pessoais (LGPD, art. 18). `null` enquanto o responsável não definir: as páginas
 * mostram que o contato está em definição e orientam a usar as opções do Perfil.
 */
export const PRIVACY_CONTACT_EMAIL: string | null = null;
