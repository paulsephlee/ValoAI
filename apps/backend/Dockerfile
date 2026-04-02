# force cache bust
FROM node:22-slim

# Install ffmpeg and yt-dlp
RUN apt-get update && apt-get install -y ffmpeg curl python3 ca-certificates --no-install-recommends && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm i -g pnpm@9.0.0

WORKDIR /app

# Copy workspace manifests for install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install deps (no frontend needed)
RUN pnpm install --frozen-lockfile --filter @valoai/backend...

# Copy source
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build TypeScript
RUN pnpm --filter @valoai/backend build

EXPOSE 3000
CMD ["pnpm", "--filter", "@valoai/backend", "start"]
