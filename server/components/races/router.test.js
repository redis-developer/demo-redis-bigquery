import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => {
  return {
    byYear: vi.fn(),
    count: vi.fn(),
    delAll: vi.fn(),
    one: vi.fn(),
    populate: vi.fn(),
  };
});

vi.mock("./store.js", () => storeMocks);

describe("races router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid year", async () => {
    const { router } = await import("./router.js");
    const app = express();
    app.use("/api/races", router);

    const response = await request(app).get("/api/races/year/not-a-number");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Year must be a valid integer.",
    });
    expect(storeMocks.byYear).not.toHaveBeenCalled();
  });

  it("returns a timed response for a valid year query", async () => {
    storeMocks.byYear.mockResolvedValue({
      total: 1,
      documents: [{ id: "races:1", value: { race_id: 1, year: 2024 } }],
    });

    const { router } = await import("./router.js");
    const app = express();
    app.use("/api/races", router);

    const response = await request(app).get("/api/races/year/2024");

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(1);
    expect(response.body.ms).toEqual(expect.any(Number));
    expect(storeMocks.byYear).toHaveBeenCalledWith(2024);
  });
});
