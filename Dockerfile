FROM oven/bun AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --ignore-scripts

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build \
  --compile \
  --minify-whitespace \
  --minify-syntax \
  --target bun \
  --outfile server \
  src/index.ts

FROM gcr.io/distroless/base

LABEL org.opencontainers.image.source="https://github.com/ocrbase-hq/ocrbase"
LABEL org.opencontainers.image.description="Lightweight, model-agnostic OCR API"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY --from=build /app/server server
COPY --from=build /app/node_modules/@bull-board/ui/dist ./node_modules/@bull-board/ui/dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["./server"]
