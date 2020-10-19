FROM node:13.12.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i
RUN npm i react-scripts -g

COPY . ./

CMD ["npm", "start"]