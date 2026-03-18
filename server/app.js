import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import * as races from "./components/races/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientBuildDir = path.resolve(__dirname, "../build/client");
const clientIndexFile = path.join(clientBuildDir, "index.html");
const shouldServeClientBuild =
  process.env.NODE_ENV === "production" && fs.existsSync(clientIndexFile);

export async function initialize() {
  await races.initialize();
}

const app = express();

app.use(cors());
app.use("/api/races", races.router);

if (shouldServeClientBuild) {
  app.use(express.static(clientBuildDir));

  app.get("/{*path}", (_, res) => {
    res.sendFile(clientIndexFile);
  });
} else {
  app.get("/", (_, res) => {
    res
      .status(503)
      .type("text/plain")
      .send(
        "Production client build not found. Start the Vite dev server with `bun run dev` and open http://localhost:5173.",
      );
  });
}

export default app;
