FROM node:20-slim

# Set up non-root user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR $HOME/app

# Copy dependency files and install production dependencies
COPY --chown=user:user package*.json ./
RUN npm install --omit=dev

# Copy application source files
COPY --chown=user:user . .

EXPOSE 3000 7860

CMD ["node", "server.js"]
