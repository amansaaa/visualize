# Build from the repo root:
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://... .
FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter @visualize/web...

COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/web apps/web

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so the API's URL must be
# known here; changing it later means rebuilding this image.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# next build imports the DB client, which only connects on the first query (same placeholder as CI)
ENV DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/placeholder
RUN pnpm --filter @visualize/web build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0
# `standalone` output is a self-contained server.js plus only the node_modules it needs
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
# Cloud Run supplies PORT at runtime
CMD ["node", "apps/web/server.js"]
