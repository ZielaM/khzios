# syntax=docker/dockerfile:1

# ── Base: Node + pnpm ───────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable pnpm
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencies (cached until the lockfile changes) ───────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# ── Build: no database access required ──────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm db:generate && pnpm build
# Keep only runtime dependencies for the final image
RUN CI=true pnpm prune --prod && rm -rf .next/cache

# ── Migrations and optional demo seed (full toolchain, run once) ────────
FROM deps AS migrator
COPY . .
RUN pnpm db:generate
CMD ["pnpm", "prisma", "migrate", "deploy"]

# ── Runtime: `next start` as an unprivileged user ───────────────────────
# Not `output: 'standalone'`: in Next 16 its server turns middleware rewrites
# into 307 redirects, which breaks next-intl's localized paths
# (https://github.com/vercel/next.js/issues/91844).
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The ISR cache is written to .next at runtime, so the app user owns /app
COPY --from=builder --chown=node:node /app ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start"]
