import { BigQuery } from "@google-cloud/bigquery";
import { getClient } from "../../redis";
import { SchemaFieldTypes } from "redis";

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
 * @property {string} circuit_map
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

const bq = new BigQuery({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});
const RACES_INDEX = "races-idx";
const RACES_PREFIX = "races:";
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
  c.googlemap AS circuit_map,
FROM
  f1.races r
JOIN
  f1.circuits c
ON c.circuitId = r.circuitId
ORDER BY r.raceId ASC`,
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

async function haveIndex() {
  const redis = await getClient();
  const indexes = await redis.ft._list();

  return indexes.some((index) => {
    return index === RACES_INDEX;
  });
}

export async function createdIndexIfNotExists() {
  const redis = await getClient();

  if (!(await haveIndex())) {
    await redis.ft.create(
      RACES_INDEX,
      {
        "$.race_id": {
          AS: "race_id",
          type: SchemaFieldTypes.NUMERIC,
        },
        "$.year": {
          AS: "year",
          type: SchemaFieldTypes.NUMERIC,
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
  await createdIndexIfNotExists();
}

export async function getRaceKeys() {
  const redis = await getClient();

  return redis.keys(`${RACES_PREFIX}*`);
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
  const [races] = /** @type [Race[]] */ (await bq.query(QUERIES.RACES));
  const [results] = /** @type [RaceResult[]] */ (
    await bq.query(QUERIES.RESULTS)
  );

  for (let race of races) {
    race.results = results.filter((result) => result.race_id === race.race_id);
    race.winner = race.results.find((result) => result.position === 1);
  }

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
