FROM oven/bun:1 AS base
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update -qq && apt-get install -y -qq curl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source
COPY src/ ./src/
COPY tsconfig.json drizzle.config.ts ./

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
