This demo shows how to prefetch BigQuery data into Redis for fast app reads. It uses Redis JSON to store race documents and Redis Search to filter them by year.

The app has two run modes:

- Local dev: Vite serves the React app on `http://localhost:5173` and proxies API calls to the Express server on `http://localhost:3000`.
- Docker: Express serves the production client build on `http://localhost:8080`.

## Requirements

- [bun](https://bun.sh/)
- [docker](https://www.docker.com/) for the containerized flow
- A BigQuery project with the [Formula One dataset](https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020) loaded
- Local Google Cloud application default credentials for the BigQuery API

## Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Update the required values:

- `REDIS_URL`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_CLOUD_PROJECT_ID`

Optional values:

- `PORT`
- `ENABLE_IMAGE_ENRICHMENT`

`ENABLE_IMAGE_ENRICHMENT=false` disables the Wikipedia image lookups during cache warmup. That is the default in Docker to keep startup predictable.

## Run locally

Start Redis separately, then run:

```bash
bun install
bun run dev
```

Open `http://localhost:5173`.

## Run with Docker

Create `.env` first, then run:

```bash
bun run docker:up
```

Open `http://localhost:8080`.

The Compose file uses `redis:alpine` and runs the app from the production build.

## Scripts

```bash
bun run dev
bun run build
bun run test
bun run lint
bun run format
bun run docker:up
bun run docker:down
```

## Redis notes

- This app uses the official `redis` Node.js client.
- Race documents are stored as Redis JSON values under the `races:*` prefix.
- A Redis Search index named `races-idx` supports the year filter.

## Redis Cloud

If you want to point the app at Redis Cloud instead of local Redis, replace `REDIS_URL` in `.env` with your Redis Cloud connection string.

## Learn more

- [Redis docs](https://redis.io/docs/latest/)
- [Redis clients](https://redis.io/docs/latest/develop/clients/)
- [Redis Insight](https://redis.io/insight/)
