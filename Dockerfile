FROM node:20-alpine
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# ponytail: keep devDependencies — react and pino-pretty are dev deps but needed at runtime
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

COPY assets ./assets
COPY fonts ./fonts
RUN mkdir -p cache && chown node:node cache

USER node
EXPOSE 8000
CMD ["node", "dist"]
