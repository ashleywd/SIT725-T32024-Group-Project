FROM node:22

WORKDIR /usr/src/app
COPY package.json ./
RUN npm i
COPY . .

CMD ["npm", "run", "start"]
