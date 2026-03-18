import { beforeEach, describe, expect, it, vi } from "vitest";

const redisModule = vi.hoisted(() => {
  return {
    getClient: vi.fn(),
  };
});

const bigQueryModule = vi.hoisted(() => {
  return {
    BigQuery: vi.fn(),
  };
});

const wikipediaModule = vi.hoisted(() => {
  return {
    findImageUrl: vi.fn(),
  };
});

vi.mock("@google-cloud/bigquery", () => bigQueryModule);
vi.mock("../../redis.js", () => redisModule);
vi.mock("../../services/wikipedia.js", () => wikipediaModule);

describe("race store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.ENABLE_IMAGE_ENRICHMENT = "false";
  });

  it("prefetches BigQuery data on a cache miss before searching Redis", async () => {
    const bigQueryClient = {
      query: vi
        .fn()
        .mockResolvedValueOnce([
          [
            {
              race_id: 1,
              year: 2024,
              round: 1,
              circuit_id: 1,
              name: "Australian Grand Prix",
              date: { value: "2024-03-24" },
              time: "05:00:00",
              url: "https://example.com/races/1",
              circuit_name: "Albert Park",
              circuit_location: "Melbourne",
              circuit_country: "Australia",
              circuit_url: "https://example.com/circuits/1",
            },
          ],
        ])
        .mockResolvedValueOnce([
          [
            {
              result_id: 1,
              race_id: 1,
              driver_id: 1,
              constructor_id: 1,
              position: 1,
              time: "1:20:43",
              laps: 58,
              driver_forename: "Max",
              driver_surname: "Verstappen",
              driver_url: "https://example.com/drivers/1",
              constructor_name: "Red Bull",
            },
          ],
        ]),
    };

    const redisClient = {
      del: vi.fn(),
      ft: {
        _list: vi.fn().mockResolvedValue(["races-idx"]),
        search: vi.fn().mockResolvedValue({
          total: 1,
          documents: [
            {
              id: "races:1",
              value: { race_id: 1, year: 2024 },
            },
          ],
        }),
      },
      json: {
        get: vi.fn(),
        mSet: vi.fn(),
      },
      scan: vi.fn().mockResolvedValue({
        cursor: "0",
        keys: [],
      }),
    };

    redisModule.getClient.mockResolvedValue(redisClient);

    const store = await import("./store.js");
    store.setBigQueryClient(bigQueryClient);

    const result = await store.byYear(2024);

    expect(bigQueryClient.query).toHaveBeenCalledTimes(2);
    expect(redisClient.json.mSet).toHaveBeenCalledTimes(1);
    expect(redisClient.ft.search).toHaveBeenCalledWith(
      "races-idx",
      "@year==2024",
      expect.objectContaining({
        DIALECT: 2,
      }),
    );
    expect(result.total).toBe(1);
  });

  it("removes cached race keys returned by scan", async () => {
    const redisClient = {
      del: vi.fn(),
      ft: {
        _list: vi.fn().mockResolvedValue([]),
        search: vi.fn(),
      },
      json: {
        get: vi.fn(),
        mSet: vi.fn(),
      },
      scan: vi.fn().mockResolvedValue({
        cursor: "0",
        keys: ["races:1", "races:2"],
      }),
    };

    redisModule.getClient.mockResolvedValue(redisClient);

    const store = await import("./store.js");

    await store.delAll();

    expect(redisClient.del).toHaveBeenCalledWith(["races:1", "races:2"]);
  });
});
