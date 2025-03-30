import "../css/Bookmarks.css";
import { useBookmarkContext } from "../context/BookmarkContext";
import Race from "../components/Race";

function Bookmarks() {
  const { bookmarks } = useBookmarkContext();

  if (bookmarks) {
    return (
      <div>
        <h2 className="bookmarks">Your Bookmarks</h2>
        <div className="bookmark-grid">
          {bookmarks.map((race) => (
            <Race race={race} key={race.id} />
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
