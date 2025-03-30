import React from "react";
import { useSearchParams } from "react-router-dom";
import Race from "../components/Race.jsx";
import { actions, hooks } from "../services/races.js";
import { hooks as notifications } from "../services/notifications.js";
import "../css/Races.css";
import Progress from "../components/Progress.jsx";

function queryToNumber(query) {
  if (typeof query !== "string" && typeof query !== "number") {
    return;
  }

  if (typeof query === "string") {
    query = query.trim();
  }

  query = Number(query);

  if (!isFinite(query)) {
    return;
  }

  return query;
}

function Races() {
  const [params, setParams] = useSearchParams({ year: "2024" });
  const queryYear = queryToNumber(params.get("year"));
  const timerRunning = notifications.useTimerRunning();
  const races = hooks.useRacesByYear({
    actionArgs: queryYear ? [queryYear] : undefined,
  });

  //Load Race year data on search
  async function handleSearch(e) {
    e.preventDefault();

    if (timerRunning) {
      return;
    }

    const search = e.target.search.value;
    const year = queryToNumber(search);

    if (year) {
      await actions.byYear(year);
      setParams({ year });
    }
  }

  return (
    <div className="home">
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="number"
          placeholder="Search for race year"
          name="search"
          defaultValue={2024}
          min={1950}
          max={2024}
        />
        <button className="search-btn" type="submit">
          Search
        </button>
      </form>

      {timerRunning ? (
        <div className="loading">
          <Progress />
        </div>
      ) : (
        <div className="race-grid">
          {races.map((race) => (
            <Race race={race} key={race.race_id} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Races;
