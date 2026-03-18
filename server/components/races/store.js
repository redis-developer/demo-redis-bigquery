import { BigQuery } from "@google-cloud/bigquery";
import { getClient } from "../../redis";
import { SCHEMA_FIELD_TYPE } from "redis";
import { findImageUrl } from "../../services/wikipedia";

/**
 * @typedef {Object} RaceResult
 * @property {number} result_id
 * @property {number} race_id
 * @property {number} driver_id
 * @property {number} constructor_id
 * @property {number} position
 * @property {string} time
 * @property {number} laps
 * @property {string} driver_forename
 * @property {string} driver_surname
 * @property {string} driver_url
 * @property {string} constructor_name
 *
 * @typedef {Object} Race
 * @property {number} race_id
 * @property {number} year
 * @property {number} round
 * @property {number} circuit_id
 * @property {string} name
 * @property {string} date
 * @property {string} time
 * @property {string} url
 * @property {string} circuit_name
 * @property {string} circuit_location
 * @property {string} circuit_country
 * @property {string} circuit_url
 * @property {string} circuit_image
 * @property {RaceResult[]} results
 * @property {RaceResult} winner
 *
 * @typedef {Object} RaceDocument
 * @property {string} id
 * @property {Race} value
 *
 * @typedef {Object} Races
 * @property {number} total
 * @property {RaceDocument} documents
 */

const RACES_INDEX = "races-idx";
const RACES_PREFIX = "races:";
let bigQueryClient = null;
const QUERIES = {
  RACES: `SELECT
  r.raceId AS race_id,
  r.year AS year,
  r.round AS round,
  r.circuitId AS circuit_id,
  r.name AS name,
  r.date AS date,
  r.time AS time,
  r.url AS url,
  c.name AS circuit_name,
  c.location AS circuit_location,
  c.country AS circuit_country,
  c.url AS circuit_url,
FROM
  f1.races r
JOIN
  f1.circuits c
ON c.circuitId = r.circuitId
ORDER BY r.date desc`,
  RESULTS: `SELECT
  re.resultId AS result_id,
  re.raceId AS race_id,
  re.driverId AS driver_id,
  re.constructorId AS constructor_id,
  re.position AS position,
  re.time AS time,
  re.laps AS laps,
  d.forename AS driver_forename,
  d.surname AS driver_surname,
  d.url AS driver_url,
  c.name AS constructor_name
FROM
  f1.results re
JOIN
  f1.drivers d
ON
  d.driverId = re.driverId
JOIN
  f1.constructors c
ON
  c.constructorId = re.constructorId
WHERE
  re.position IS NOT NULL
ORDER BY re.raceId ASC, re.position ASC`,
};

function getBigQueryClient() {
  if (bigQueryClient) {
    return bigQueryClient;
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set.");
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set.");
  }

  bigQueryClient = new BigQuery({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });

  return bigQueryClient;
}

export function setBigQueryClient(client) {
  bigQueryClient = client;
}

async function haveIndex() {
  const redis = await getClient();
  const indexes = await redis.ft._list();

  return indexes.some((index) => {
    return index === RACES_INDEX;
  });
}

export async function createIndexIfNotExists() {
  const redis = await getClient();

  if (!(await haveIndex())) {
    await redis.ft.create(
      RACES_INDEX,
      {
        "$.race_id": {
          AS: "race_id",
          type: SCHEMA_FIELD_TYPE.NUMERIC,
        },
        "$.year": {
          AS: "year",
          type: SCHEMA_FIELD_TYPE.NUMERIC,
        },
      },
      {
        ON: "JSON",
        PREFIX: RACES_PREFIX,
      },
    );
  }
}

export async function dropIndex() {
  const redis = await getClient();

  if (await haveIndex()) {
    await redis.ft.dropIndex(RACES_INDEX);
  }
}

export async function initialize() {
  await createIndexIfNotExists();
}

export async function getRaceKeys() {
  const redis = await getClient();
  const keys = [];
  let cursor = "0";

  do {
    const scanResult = await redis.scan(cursor, {
      MATCH: `${RACES_PREFIX}*`,
      COUNT: 100,
    });

    cursor = String(scanResult.cursor);
    keys.push(...scanResult.keys);
  } while (cursor !== "0");

  return keys;
}

export async function delAll() {
  const redis = await getClient();

  const keys = await getRaceKeys();

  if (keys.length > 0) {
    await redis.del(keys);
  }
}

export async function count() {
  const keys = await getRaceKeys();

  return keys.length;
}

export async function populate() {
  await delAll();
  const redis = await getClient();
  const [races] = /** @type {[Race[]]} */ (
    await getBigQueryClient().query(QUERIES.RACES)
  );
  const [results] = /** @type {[RaceResult[]]} */ (
    await getBigQueryClient().query(QUERIES.RESULTS)
  );
  const circuitGroups = new Map();
  const resultsByRaceId = new Map();

  for (const result of results) {
    const raceResults = resultsByRaceId.get(result.race_id) ?? [];
    raceResults.push(result);
    resultsByRaceId.set(result.race_id, raceResults);
  }

  for (const race of races) {
    const racesForCircuit = circuitGroups.get(race.circuit_url) ?? [];
    racesForCircuit.push(race);
    circuitGroups.set(race.circuit_url, racesForCircuit);

    race.results = resultsByRaceId.get(race.race_id) ?? [];
    race.winner = race.results.find((result) => result.position === 1);
    race.circuit_image = race.circuit_image ?? "";
  }

  if (process.env.ENABLE_IMAGE_ENRICHMENT !== "false") {
    for (const result of results) {
      const image = await findImageUrl(result.driver_url, "driver");
      result.driver_image = image ?? "";
    }

    for (const [circuitUrl, racesForCircuit] of circuitGroups.entries()) {
      const image = await findImageUrl(circuitUrl, "circuit");

      for (const race of racesForCircuit) {
        race.circuit_image = image ?? "";
      }
    }
  } else {
    for (const result of results) {
      result.driver_image = "";
    }
  }

  if (races.length > 0) {
    await redis.json.mSet(
      races.map((race) => {
        return {
          key: `${RACES_PREFIX}${race.race_id}`,
          path: "$",
          value: race,
        };
      }),
    );
  }
}

export async function byYear(year) {
  const total = await count();

  if (total <= 0) {
    await populate();
  }

  const redis = await getClient();

  return /** @type {Promise<Races>} */ redis.ft.search(
    RACES_INDEX,
    `@year==${year}`,
    {
      DIALECT: 2,
      LIMIT: { from: 0, size: 9999 },
    },
  );
}

export async function one(raceId) {
  const total = await count();

  if (total <= 0) {
    await populate();
  }

  const redis = await getClient();

  return /** @type Promise<Race> */ (
    redis.json.get(`${RACES_PREFIX}${raceId}`)
  );
}
