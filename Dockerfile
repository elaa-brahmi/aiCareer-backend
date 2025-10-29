# Use Debian-based Node image (not Alpine)
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and system libraries
RUN apt-get update && apt-get install -y libc6 libstdc++6 && \
    npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup --gid 1001 nodejs && \
    adduser --uid 1001 --gid 1001 --disabled-password nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 9090

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get(`${process.env.RENDER_APP_URL}/api/health`, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the app
CMD ["npm", "start"]
