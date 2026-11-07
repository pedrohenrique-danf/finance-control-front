import type { NextConfig } from "next";

// Arquivo de ferramenta: exceção documentada à regra de ler process.env só em lib/config/env.ts.
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
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
          // Content-Security-Policy: [PENDENTE DE DEFINIÇÃO]
        ],
      },
    ];
  },
};

export default nextConfig;
