FROM --platform=linux/amd64 node:11.15

WORKDIR  /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./dist .

EXPOSE 1001



CMD ["node", "main.js"]

