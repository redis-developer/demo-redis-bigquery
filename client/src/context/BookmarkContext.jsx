import { createContext, useState, useContext, useEffect } from "react";

const BookmarkContext = createContext();

export const useBookmarkContext = () => useContext(BookmarkContext);

export const ContextProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState(() => {
    const storedBookmarks = localStorage.getItem("bookmarks");
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  });
  const [selectedRace, setRace] = useState(() => {
    return localStorage.getItem("race") ?? "";
  });

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("race", selectedRace);
  }, [selectedRace]);

  const addToBookmarks = (race) => {
    setBookmarks((prev) => {
      if (prev.some((bookmark) => bookmark.race_id === race.race_id)) {
        return prev;
      }

      return [...prev, race];
    });
  };

  const removeFromBookmarks = (raceId) => {
    setBookmarks((prev) => prev.filter((race) => race.race_id !== raceId));
  };

  const isBookmark = (raceId) => {
    return bookmarks.some((race) => race.race_id === raceId);
  };

  // Function to update the string
  const changeRace = (raceId) => {
    setRace(raceId);
  };

  const value = {
    bookmarks,
    selectedRace,
    addToBookmarks,
    removeFromBookmarks,
    isBookmark,
    changeRace,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};
