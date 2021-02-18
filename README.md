
[![Build Status](https://drone.simoneromano.eu/api/badges/simoneromano96/thunder-server/status.svg)](https://drone.simoneromano.eu/simoneromano96/thunder-server)

# thunder-server

Before running: `cp .env.local .env` 

Sync DB with prisma schema and generate client: `npx prisma db push --preview-feature`

After editing the schema: `npx prisma migrate dev --name migration-name --preview-feature`

Create the client: `npx prisma generate`
