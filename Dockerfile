FROM node:18-alpine
WORKDIR /app
COPY index.html .
RUN npm install -g serve
CMD ["sh", "-c", "serve -s . -l tcp://0.0.0.0:${PORT:-3000}"]
