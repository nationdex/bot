# syntax=docker/dockerfile:1.7

FROM node:24-slim AS deps
WORKDIR /app
ENV CI=true \
    NPM_CONFIG_IGNORE_SCRIPTS=true
COPY .npmrc package.json package-lock.json ./
RUN npm ci

FROM deps AS build-bot
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM deps AS build-admin
COPY website/package.json website/package-lock.json ./website/
RUN npm ci --prefix website
COPY website ./website
RUN npm run build --prefix website

# --- Bot runtime ---
FROM deps AS runtime-bot
ENV NODE_ENV=production
WORKDIR /app
RUN mkdir -p /app/database /app/logs /app/src/config
COPY --from=build-bot /app/dist ./dist
COPY src/config/variables.json ./src/config/variables.json
RUN useradd --system --uid 1001 --home /app --shell /usr/sbin/nologin nationdex \
    && chown -R nationdex:nationdex /app
USER nationdex
CMD ["node", "dist/index.js"]

# --- Admin runtime ---
FROM build-admin AS runtime-admin
ENV NODE_ENV=production
WORKDIR /app/website
RUN useradd --system --uid 1001 --home /app/website --shell /usr/sbin/nologin nationdex \
    && chown -R nationdex:nationdex /app/website
USER nationdex
EXPOSE 3000
CMD ["node", "node_modules/vite/bin/vite.js", "preview", "--port", "3000", "--host"]
