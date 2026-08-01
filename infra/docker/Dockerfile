FROM node:22.18.0-bookworm-slim AS workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

FROM workspace AS api
RUN pnpm --filter @nextstep/api... build
ENV HOST=0.0.0.0
ENV PORT=3001
EXPOSE 3001
CMD ["sh", "-c", "pnpm prisma:migrate:deploy && pnpm --filter @nextstep/api start"]

FROM workspace AS web
RUN pnpm --filter @nextstep/web... build
EXPOSE 3000
CMD ["pnpm", "--filter", "@nextstep/web", "exec", "next", "start", "--hostname", "0.0.0.0"]
