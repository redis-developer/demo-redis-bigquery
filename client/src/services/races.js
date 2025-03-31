import * as tates from "tates";

import { actions as notifications } from "./notifications";
import { createStateHook } from "react-tates";

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
 * @property {{ value: string }} date
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
 *
 * @typedef {Object} RacesState
 * @property {Race[]} races
 * @property {number} year
 * @property {number} raceId
 * @property {Race} race
 * @property {{ sql: string; redis: string; }} queries
 * @property {number} count
 *
 * @typedef {Object} RacesResponse
 * @property {number} ms
 * @property {Races} data
 *
 * @typedef {Object} RaceResponse
 * @property {number} ms
 * @property {Race} data
 *
 * @typedef {Object} CacheResponse
 * @property {number} ms
 */

const tate = /** @type {tates.State<RacesState>} */ (tates.createState());
const { state } = tate;
const racesSql = `SELECT   Row_number() OVER(ORDER BY races.date DESC) AS id,
         races.race_id,
         races.year,
         Format_date('%b-%d-%Y', races.date)  AS date,
         races.name,
         circuits.location                    AS circuit_location,
         circuits.country                     AS circuit_country,
         drivers.forename                     AS winner_forename,
         drivers.surname                      AS winner_surname,
FROM     f1.drivers AS drivers
JOIN     f1.results AS results
ON       drivers.driverid = results.driverid
JOIN     f1.races AS races
ON       races.raceid = results.raceid
JOIN     f1.circuits AS circuits
ON       races.circuitid = circuits.circuitid
WHERE    results.position = 1
AND      races.year = $year;`;
const racesRedis = `FT.SEARCH races-idx "@year==$year" DIALECT 2`;
const raceSql = `SELECT   Row_number() OVER(ORDER BY results.position ASC) AS id,
         results.position,
         Format_date('%b-%d-%Y', races.date) AS date,
         races.name                          AS name,
         circuits.name                       AS circuit_name,
         circuits.location                   AS circuit_location,
         circuits.country                    AS circuit_country,
         drivers.forename                    AS driver_forename,
         drivers.surname                     AS driver_surname,
         results.laps,
         results.time,
         constructors.name                   AS constructor,
         drivers.url                         AS driver_url,
         circuits.url                        AS circuit_url
FROM     f1.results    AS results
JOIN     f1.races      AS races
ON       results.raceid = races.raceid
JOIN     f1.drivers AS drivers
ON       results.driverid = drivers.driverid
JOIN     f1.circuits AS circuits
ON       races.circuitid = circuits.circuitid
JOIN     f1.constructors AS constructors
ON       results.constructorid = constructors.constructorid
WHERE    races.raceid = $raceid
AND      results.position IS NOT NULL`;
const raceRedis = `JSON.GET races:$raceId`;

export const actions = {
  /**
   * @param {number} year
   */
  async byYear(year = 2024) {
    notifications.startTimer();

    const response = await fetch(`/api/races/year/${year}`);
    const racesResults = /** @type RacesResponse */ (await response.json());

    notifications.stopTimer();
    notifications.loadTime(racesResults.ms);

    state.year = year;
    state.queries = {
      sql: racesSql.replace("$year", year),
      redis: racesRedis.replace("$year", year),
    };
    state.races = racesResults.data.documents.map((doc) => doc.value);
    actions.count();
  },

  /**
   * @param {number} raceId
   */
  async one(raceId) {
    if (!raceId) {
      return;
    }

    notifications.startTimer();

    const response = await fetch(`/api/races/${raceId}`);
    const raceResponse = /** @type RaceResponse */ (await response.json());

    notifications.stopTimer();
    notifications.loadTime(raceResponse.ms);

    state.raceId = raceId;
    state.queries = {
      sql: raceSql.replace("$raceId", raceId),
      redis: raceRedis.replace("$raceId", raceId),
    };
    state.race = raceResponse.data;
    actions.count();
  },

  async count() {
    const response = await fetch(`/api/races/count`);
    const total = /** @type number */ (await response.json());

    state.count = total;
  },

  async clear() {
    await fetch(`/api/races/clear`);

    state.count = 0;
    state.races = [];
    state.race = null;
  },

  async cache() {
    notifications.startTimer();

    const response = await fetch(`/api/races/cache`);
    const { ms } = /** @type CacheResponse */ (await response.json());

    notifications.stopTimer();

    await actions.byYear(state.year);
    await actions.one(state.raceId);
    await actions.count();

    setTimeout(() => {
      notifications.loadTime(ms);
    }, 200);
  },
};

export const hooks = {
  useRacesByYear: createStateHook({
    tate,
    action: actions.byYear,
    property: "races",
    initialValue: /** @type {Race[]} */ ([]),
  }),

  useRace: createStateHook({
    tate,
    action: actions.one,
    property: "race",
    initialValue: /** @type {Race | null} */ (null),
  }),

  useCount: createStateHook({
    tate,
    action: actions.count,
    property: "count",
    initialValue: 0,
  }),

  useQueries: createStateHook({
    tate,
    action: actions.count,
    property: "queries",
    initialValue: { sql: "", redis: "" },
  }),
};
