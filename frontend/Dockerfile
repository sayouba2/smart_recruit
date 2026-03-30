FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy all local files into the container
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite server allowing external connections (0.0.0.0)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
