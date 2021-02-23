
[![Build Status](https://drone.simoneromano.eu/api/badges/simoneromano96/thunder-server/status.svg)](https://drone.simoneromano.eu/simoneromano96/thunder-server)

# thunder-server

Before running: `cp .env.local .env` 

Sync DB with prisma schema and generate client: `npx prisma db push --preview-feature`

After editing the schema: `npx prisma migrate dev --name migration-name --preview-feature`

Create the client: `npx prisma generate`

## CI/CD

### Required secrets

* `docker_auth_config` Export from `~/.docker/config.json`

* `host` The ssh host with the port if it is non-default

* `user` The ssh user

* `ssh_key` The ssh private key

* `github_username` GitHub username

* `github_token` GitHub token

### Build/Deploy for prod

Promotion targets:

* production

* production-together

* [ ] Autenticazione e sistema licenze

* [ ] Personalizzazioni dashboard (colori)
