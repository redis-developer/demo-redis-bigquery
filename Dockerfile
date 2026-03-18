FROM oven/bun:1.3.10-alpine AS base
WORKDIR /usr/src/app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS release
ENV NODE_ENV=production
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY server ./server
COPY assets ./assets
COPY --from=build /usr/src/app/build ./build
USER bun
EXPOSE 8080
ENTRYPOINT ["bun", "server/index.js"]
