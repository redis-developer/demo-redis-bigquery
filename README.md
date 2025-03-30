This demo uses Redis as a frontend cache for BigQuery. It demonstrates how to
apply the cache prefetching strategy and use Redis for JSON storage and search.
The app is written in Express and React with vite.

## Requirements

- [gcloud
  credentials](https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment)
- [BigQuery](https://cloud.google.com/bigquery) setup with the [Formula One](https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020) dataset loaded
- [bun](https://bun.sh/)
- [docker](https://www.docker.com/)
  - Optional

## Getting started

Copy and edit the `.env` file:

```bash
cp .env.example .env
```

Your `.env` file should contain the connection string you copied from Redis Cloud. It also has the Google Cloud credentials for connecting to BigQuery.

1. Copy the JSON from the generated `application_default_credentials.json` into your `.env` file using the `GOOGLE_APPLICATION_CREDENTIALS` variable
2. Set the `GOOGLE_CLOUD_PROJECT_ID` environment variable in your `.env` file to the associated gcloud project you want to use.

Your `.env.docker` file will overwrite the REDIS_URL to use the appropriate docker internal URLs. Here is
an example:

```bash
REDIS_URL="redis://redis:6379"
```

Next, spin up docker containers:

```bash
docker compose up -d --build
```

You should have a server running on `http://localhost:<port>` where the port is set in your `.env` file (default is 8080).

Visit the localhost url to see your site.

## Running locally outside docker

To run the development server outside of docker:

```bash
bun install
# then
bun dev
```

## Other Scripts

Formatting code:

```bash
bun format
```

## Connecting to Redis Cloud

If you don't yet have a database setup in Redis Cloud [get started here for free](https://redis.io/try-free/).

To connect to a Redis Cloud database, log into the console and find the following:

1. The `public endpoint` (looks like `redis-#####.c###.us-east-1-#.ec2.redns.redis-cloud.com:#####`)
1. Your `username` (`default` is the default username, otherwise find the one you setup)
1. Your `password` (either setup through Data Access Control, or available in the `Security` section of the database
   page.

Combine the above values into a connection string and put it in your `.env` and `.env.docker` accordingly. It should
look something like the following:

```bash
REDIS_URL="redis://default:<password>@redis-#####.c###.us-west-2-#.ec2.redns.redis-cloud.com:#####"
```

## Learn more

To learn more about Redis, take a look at the following resources:

- [Redis Documentation](https://redis.io/docs/latest/) - learn about Redis products, features, and commands.
- [Learn Redis](https://redis.io/learn/) - read tutorials, quick starts, and how-to guides for Redis.
