FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

EXPOSE 3000

CMD ["npm", "start"]

