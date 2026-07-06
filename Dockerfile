# =========================================================================
# DOCKERFILE: Single Stage Build (Single Container Banane Ka Simple Formula)
# Analogy: Maggi recipe ki tarah - pehle ingredients layenge, prepare karenge aur pakayenge.
# Use: Next.js code ko run karne ke liye ek hi stage me install aur build karna.
# =========================================================================

# Official lightweight Node.js image use karenge
FROM node:alpine

# Container ke andar '/app' folder ko working directory banayenge
WORKDIR /app

# Dependency installation cache ke liye pehle config files copy karenge
COPY package*.json ./

# Sabhi dependencies (development + production) install karenge taaki build succeed ho sake
RUN npm install

# Apne project ka poora source code copy karenge
COPY . .

# Database queries ke liye Prisma client code generate karenge
RUN npx prisma generate

# Next.js optimization telemetry band karenge aur build execute karenge
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Port 3000 open (expose) karenge jisse bahar se connect kiya ja sake
EXPOSE 3000

# Next.js production server start karne ki startup command
CMD ["npm", "run", "start"]
