import "dotenv/config";
import app, { initialize } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

export async function startServer() {
  await initialize();

  return await new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      resolve(server);
    });

    server.on("error", reject);
  });
}

if (import.meta.main) {
  startServer().catch((error) => {
    console.error("Failed to start the server.");
    console.error(error);
    process.exit(1);
  });
}
