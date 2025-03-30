import Race from "../components/Race.jsx";
import { useState, useEffect } from "react";
import { actions, hooks } from "../services/races.js";
import { hooks as notifications } from "../services/notifications.js";
import "../css/Home.css";
import Progress from "../components/Progress.jsx";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const timerRunning = notifications.useTimerRunning();
  const races = hooks.useRacesByYear({ invokeAction: false });

  async function searchRaces(year = 2024) {
    await actions.byYear(year);
  }

  //Load Race year data on page load
  useEffect(() => {
    searchRaces();
  }, []);

  //Load Race year data on search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (timerRunning) return;

    const year = Number(searchQuery.trim());

    if (!year || !isFinite(year)) return;

    await searchRaces(Number(searchQuery.trim()));
  };

  return (
    <div className="home">
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="Search for race year"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

export default Home;
