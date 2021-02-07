FROM node:alpine as build

WORKDIR /app

COPY . .

# Install build toolchain, install node deps and compile native add-ons
RUN apk add python3 make g++

RUN npm i

RUN npm run build

# Remove all source map files
RUN find . -name "*.js.map" -type f -delete

# Remove generated folder
RUN rm -rf ./dist/generated

# Add prisma schema
COPY ./prisma ./dist/prisma

RUN ls -al ./dist

FROM node:alpine as production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package.json .

# TODO: This must be optimized, python/make/g++ are required in build phase
# Install build toolchain, install node deps and compile native add-ons
RUN apk add python3 make g++

RUN npm i

COPY --from=build /app/dist ./dist

CMD [ "npm", "start" ]
