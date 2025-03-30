import Result from "../components/Result.jsx";
import { useEffect } from "react";
import "../css/Bookmarks.css";
import { useParams } from "react-router-dom";
import { actions, hooks } from "../services/races.js";
import { hooks as notifications } from "../services/notifications.js";
import Progress from "../components/Progress.jsx";

function RaceData() {
  const { raceId } = useParams();
  const timerRunning = notifications.useTimerRunning();
  const race = hooks.useRace({ invokeAction: false });

  async function getRace(id) {
    await actions.one(id);
  }

  //Load Race data on page load
  useEffect(() => {
    getRace(raceId);
  }, [raceId]);

  return (
    <div className="home">
      {timerRunning ? (
        <div className="loading">
          <Progress />
        </div>
      ) : (
        race && (
          <div>
            <div>
              <h1>{race.name}</h1>
              <h3>
                <br />
                <a href={race.circuit_url} target="_blank">
                  {race.circuit_name}
                </a>
                <br />
                {race.circuit_location}, {race.circuit_country}
                <br />
                {race.date.value}
              </h3>
            </div>
            <div className="driver-grid">
              {race.results.map((result) => (
                <Result result={result} key={result.result_id} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default RaceData;
