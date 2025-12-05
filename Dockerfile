FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install --production

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]