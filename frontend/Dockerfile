# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# This build will now use the NEXT_PUBLIC_API_URL provided by docker-compose
RUN npm run build

# Stage 2: Create the final, testable image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/jest.config.js .
COPY --from=builder /app/jest.setup.js .
COPY --from=builder /app/tsconfig.json .

# --- REFACTOR: Set the API URL env var in the final image as well ---
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# --- END OF REFACTOR ---

EXPOSE 3000

CMD ["npm", "start"]
