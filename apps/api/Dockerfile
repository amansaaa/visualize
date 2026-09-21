# Build from the repo root:  docker build -f apps/api/Dockerfile .
# The API has no build step: it runs TypeScript source directly with tsx, and the workspace packages
# (@visualize/shared, @visualize/db) are also imported as source.
FROM node:24-slim
RUN corepack enable
WORKDIR /repo

# Manifests first, so the install layer is cached until dependencies actually change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter @visualize/api...

COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api

ENV NODE_ENV=production
USER node
WORKDIR /repo/apps/api
# Cloud Run supplies PORT at runtime; secrets and config come from env vars, not a .env file
CMD ["node", "--import", "tsx", "src/index.ts"]
