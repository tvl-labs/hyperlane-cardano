FROM node:18.2.0

WORKDIR /hyperlane-cardano-rpc

COPY . .

RUN yarn install

RUN yarn build

CMD ["yarn", "start-rpc-preprod"]
