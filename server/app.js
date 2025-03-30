import path from "path";
import express from "express";
import cors from "cors";
import * as races from "./components/races/index.js";

export async function initialize() {
  await races.initialize();
}

const app = express();

app.use(express.static("client/"));
app.use(cors());
app.use("/api/races", races.router);

app.get("/*", (_, res) => {
  res.sendFile(path.join(__dirname, "../client/", "index.html"), (err) => {
    if (err) {
      console.log(err);
    }
  });
});

export default app;
