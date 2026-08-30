# syntax=docker/dockerfile:1

# ─── Build stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# No NEXT_PUBLIC_API_URL is baked: the client calls a relative `/api` (same
# origin), so the client bundle is env-agnostic and promotes staging -> prod
# unchanged. BACKEND_ORIGIN is a build-time-only knob for the server-side `/api`
# rewrite (next.config.ts): set it for local/compose to proxy without an
# ingress; leave it empty in CI so prod routes `/api` at the ingress instead.
ARG BACKEND_ORIGIN=""
ENV BACKEND_ORIGIN=$BACKEND_ORIGIN
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Runner stage: Next.js standalone output ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN apk add --no-cache curl
# The standalone bundle already contains the minimal node_modules it needs.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT:-3000}/" || exit 1
CMD ["node", "server.js"]
