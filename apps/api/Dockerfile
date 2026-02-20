FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source
COPY src/ ./src/
COPY drizzle/ ./drizzle/
COPY tsconfig.json drizzle.config.ts ./

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
