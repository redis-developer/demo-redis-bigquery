import "../css/Bookmarks.css";
import { useBookmarkContext } from "../context/BookmarkContext";
import Race from "../components/Race.jsx";

function Bookmarks() {
  const { bookmarks } = useBookmarkContext();

  if (bookmarks.length > 0) {
    return (
      <div>
        <h2 className="bookmarks">Your Bookmarks</h2>
        <div className="bookmark-grid">
          {bookmarks.map((race) => (
            <Race race={race} key={race.race_id} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarks-empty">
      <h2>No bookmarks</h2>
      <p>Start bookmarking races to list them here.</p>
    </div>
  );
}

export default Bookmarks;
