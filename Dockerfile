# Base
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
# Construimos tanto el API (bot) como el Dashboard
RUN pnpm --filter @workspace/api-server build
RUN pnpm --filter @workspace/bot-dashboard build

FROM base AS runner
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app

EXPOSE 5000
CMD [ "pnpm", "--filter", "@workspace/api-server", "start" ]
