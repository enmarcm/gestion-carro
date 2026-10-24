FROM node:22-alpine AS build
RUN npm i -g pnpm@10
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @carro/web...
COPY packages/shared packages/shared
COPY apps/web apps/web
ARG VITE_API_URL=https://apicarro.enmarcm.site
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @carro/web build

FROM nginxinc/nginx-unprivileged:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
