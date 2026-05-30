# syntax=docker/dockerfile:1
FROM node:22-alpine

# Install OpenSSL required by Prisma and libc6-compat for Node.js
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy package management files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (we keep devDependencies for seeding and running migrations)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN pnpm db:generate

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN pnpm build

# Expose port
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Add entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set entrypoint to run migrations and seeding before starting the app
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm", "start"]
