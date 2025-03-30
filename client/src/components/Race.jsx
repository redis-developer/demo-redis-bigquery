import "../css/Race.css";
import { useBookmarkContext } from "../context/BookmarkContext";
import { Link } from "react-router-dom";

function Race({ race }) {
  const { changeRace, isBookmark, addToBookmarks, removeFromBookmarks } =
    useBookmarkContext();
  const bookmark = isBookmark(race.race_id);

  function onBookmark(e) {
    e.preventDefault();
    if (bookmark) removeFromBookmarks(race.race_id);
    else addToBookmarks(race);
  }

  function onCardClick() {
    changeRace(race.race_id);
  }

  return (
    <Link to={`/races/${race.race_id}`}>
      <div className="race" onClick={onCardClick}>
        <div className="race-img">
          <img src={race.circuit_map} alt={race.name} />
          <div className="race-overlay">
            <button
              className={`bookmark-btn ${bookmark ? "active" : ""}`}
              onClick={onBookmark}
            >
              ★
            </button>
          </div>
        </div>
        <div className="race-info">
          <h2>{race.name}</h2>
          <h4>{race.date.value}</h4>
          <p>
            {race.circuit_location}, {race.circuit_country}
          </p>
          <p>
            <b>
              Winner: {race.winner.driver_forename} {race.winner.driver_surname}
            </b>
          </p>
        </div>
      </div>
    </Link>
  );
}

export default Race;
