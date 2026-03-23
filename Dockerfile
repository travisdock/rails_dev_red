FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install -g serve
EXPOSE 8080
CMD ["serve", ".", "-p", "8080", "--no-clipboard"]
