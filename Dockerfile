# Deterministic build for MCP registry/directory sandboxes (Glama and friends) and for
# self-hosting the HTTP transport.
#
# The server starts and answers tools/list WITHOUT any credential: two of the seven tools are
# public guidance, and the rest advertise their schema and report that a key is required only
# when actually invoked. That keeps sandbox introspection working with no secret baked in.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY README.md LICENSE ./

# stdio transport by default (what MCP clients spawn).
# Override for HTTP:  docker run -p 3000:3000 <image> --http   (set HOST=0.0.0.0)
ENTRYPOINT ["node", "dist/cli.js"]
