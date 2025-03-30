import express from "express";
import { byYear, count, delAll, one, populate } from "./store";

export const router = express.Router();

router.get("/year/:year", async (req, res) => {
  const start = performance.now();
  const data = await byYear(req.params.year);
  const end = performance.now();

  res.json({
    ms: end - start,
    data,
  });
});

router.get("/count", async (_, res) => {
  res.json(await count());
});

router.get("/clear", async (_, res) => {
  await delAll();

  res.sendStatus(200);
});

router.get("/cache", async (_, res) => {
  const start = performance.now();
  await populate();
  const end = performance.now();

  res.json({
    ms: end - start,
  });
});

router.get("/:raceId", async (req, res) => {
  const start = performance.now();
  const data = await one(req.params.raceId);
  const end = performance.now();

  res.json({
    ms: end - start,
    data,
  });
});
