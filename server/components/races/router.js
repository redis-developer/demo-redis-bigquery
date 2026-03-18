import express from "express";
import { byYear, count, delAll, one, populate } from "./store";

export const router = express.Router();

function parseInteger(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function measureResponse(start, data) {
  return {
    ms: performance.now() - start,
    data,
  };
}

function route(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

router.get(
  "/year/:year",
  route(async (req, res) => {
    const year = parseInteger(req.params.year);

    if (year === null) {
      res.status(400).json({
        error: "Year must be a valid integer.",
      });
      return;
    }

    const start = performance.now();
    const data = await byYear(year);

    res.json(measureResponse(start, data));
  }),
);

router.get(
  "/count",
  route(async (_, res) => {
    res.json(await count());
  }),
);

router.get(
  "/clear",
  route(async (_, res) => {
    await delAll();

    res.sendStatus(200);
  }),
);

router.get(
  "/cache",
  route(async (_, res) => {
    const start = performance.now();
    await populate();

    res.json({
      ms: performance.now() - start,
    });
  }),
);

router.get(
  "/:raceId",
  route(async (req, res) => {
    const raceId = parseInteger(req.params.raceId);

    if (raceId === null) {
      res.status(400).json({
        error: "Race ID must be a valid integer.",
      });
      return;
    }

    const start = performance.now();
    const data = await one(raceId);

    res.json(measureResponse(start, data));
  }),
);

router.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: error instanceof Error ? error.message : "Unexpected server error.",
  });
});
