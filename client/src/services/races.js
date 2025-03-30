import * as tates from "tates";

import { actions as notifications } from "./notifications";
import { createKeyedStateHook, createStateHook } from "react-tates";

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
 *
 * @typedef {Object} RacesState
 * @property {Race[]} races
 * @property {number} year
 * @property {number} raceId
 * @property {Race} race
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

    notifications.loadTime(ms);
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
};
