import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const racesModule = vi.hoisted(() => {
  return {
    initialize: vi.fn(),
    router: (_req, _res, next) => next(),
  };
});

vi.mock("./components/races/index.js", () => racesModule);

describe("app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a helpful message when the production client build is missing", async () => {
    const { default: app } = await import("./app.js");

    const response = await request(app).get("/");

    expect(response.status).toBe(503);
    expect(response.text).toContain("Vite dev server");
  });
});
