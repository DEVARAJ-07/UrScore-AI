# Use Node.js LTS
FROM node:18-slim

# Install Chromium and required fonts/libraries for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Copy root monorepo scripts and configs
COPY package*.json ./

# Copy sub-project package managers
COPY backend/package*.json ./backend/
COPY worker/package*.json ./worker/

# Install dependencies across all components
RUN npm install
RUN npm run install-backend
RUN npm run install-worker

# Copy source code
COPY backend/ ./backend/
COPY worker/ ./worker/

# Compile TypeScript to JavaScript
RUN npm run build --prefix backend
RUN npm run build --prefix worker

# Hugging Face Spaces expects the app to run on port 7860
EXPOSE 7860
ENV PORT=7860

# Start Express.js API Gateway backend server
CMD ["node", "backend/dist/server.js"]
