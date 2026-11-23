import type { NextConfig } from "next";

// Arquivo de ferramenta: exceção documentada à regra de ler process.env só em lib/config/env.ts.
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";
const isDev = process.env.NODE_ENV === "development";

/**
 * CSP sem nonce (guia "Content Security Policy" do Next.js): tudo vem da própria origem (a fonte é servida pelo
 * next/font, a API pelo rewrite /api/*). `'unsafe-inline'` em script-src é exigido pelos scripts de hidratação do
 * Next sem nonce (nonce obrigaria renderização dinâmica em todas as páginas); `'unsafe-eval'` só em dev (React).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    // Importação: arquivo de até 5 MB (limite do backend) enviado por Server Action.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Mesma origem: o navegador fala só com o frontend; /api/* é repassado ao backend.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
