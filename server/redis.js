import { createClient } from "redis";

if (!process.env.REDIS_URL) {
  console.error("REDIS_URL not set");
}

let client = null;
let clientPromise = null;

/**
 * @param {import("redis").RedisClientOptions} [options]
 *
 * @returns {Promise<ReturnType<typeof createClient>>}
 */
export async function getClient(options) {
  const resolvedOptions = Object.assign(
    { url: process.env.REDIS_URL },
    options,
  );

  if (client?.isOpen && client.options?.url === resolvedOptions.url) {
    return client;
  }

  if (clientPromise && client?.options?.url === resolvedOptions.url) {
    return clientPromise;
  }

  client = createClient(resolvedOptions);
  client.on("error", (err) => {
    console.error("Redis client error", err);
  });

  clientPromise = client.connect().then(() => client);

  return clientPromise;
}

export async function closeClient() {
  if (client) {
    if (client.isOpen) {
      await client.quit();
    } else {
      client.disconnect();
    }
  }

  client = null;
  clientPromise = null;
}
