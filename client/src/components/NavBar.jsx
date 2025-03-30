import { Link } from "react-router-dom";
import "../css/NavBar.css";
import * as racesService from "../services/races.js";
import * as notificationService from "../services/notifications.js";
import Progress from "./Progress.jsx";

function NavBar() {
  const count = racesService.hooks.useCount();
  const loadTime = notificationService.hooks.useLoadTime();
  const timerRunning = notificationService.hooks.useTimerRunning();

  function handleCacheButtonClick(ev) {
    ev.preventDefault();

    if (count > 0) {
      racesService.actions.clear();
    } else {
      racesService.actions.cache();
    }
  }

  function formatTime(milliseconds) {
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor(milliseconds % 1000);

    return `${seconds}${String(ms).padStart(3, "0")} ms`;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="https://redis.io">
          <img src="https://redis.io/wp-content/uploads/2024/04/Logotype.svg"></img>
        </Link>
      </div>
      <div className="timer">
        Load Time: {timerRunning ? <Progress /> : formatTime(loadTime)}
      </div>
      <div className="navbar-links">
        <button onClick={handleCacheButtonClick} className="nav-button">
          {count > 0 ? "Clear" : "Cache"}
        </button>
        <Link className="nav-link" to="/">
          Home
        </Link>
        <Link className="nav-link" to="/bookmarks">
          Bookmarks
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
