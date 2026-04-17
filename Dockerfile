FROM node:24-alpine

# Install Bun on top of the pinned Node 24 LTS base.
RUN npm install -g bun

WORKDIR /app

# Copy root dependency files and patches first for layer caching
COPY package.json bun.lock ./
COPY patches/ ./patches/

# Install and update root dependencies
RUN bun install --frozen-lockfile && bun update

# Copy website package files
COPY website/package.json website/bun.lock ./website/

# Install and update website dependencies
RUN cd website && bun install --frozen-lockfile && bun update && cd ..

# Check if `config/extra.toml` exists and install all dependencias
# Dockerfile will create extra folder if it doesn't exists
RUN mkdir -p extra; fi 
RUN --mount=type=cache,target=/root/.cache/ \
    if [ -f config/extra.toml ]; then bun install $(bun run ndpackages.ts config/extra.toml) --cwd=extra; fi

# Copy the entire codebase
COPY . .

# Build the Next.js admin panel
RUN cd website && bun run build && cd ..
