import { createContext, useState, useContext, useEffect } from "react";

const BookmarkContext = createContext();

export const useBookmarkContext = () => useContext(BookmarkContext);

export const ContextProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedRace, setRace] = useState("");

  useEffect(() => {
    const storedBookmarks = localStorage.getItem("bookmarks");
    if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
  }, []);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Initialize from local storage if available
  useEffect(() => {
    const storedRace = localStorage.getItem("race");
    if (storedRace) setRace(storedRace);
  }, []);

  // Effect to update local storage when the string changes
  useEffect(() => {
    localStorage.setItem("race", selectedRace);
  }, [selectedRace]);

  const addToBookmarks = (race) => {
    setBookmarks((prev) => [...prev, race]);
  };

  const removeFromBookmarks = (raceId) => {
    setBookmarks((prev) => prev.filter((race) => race.id !== raceId));
  };

  const isBookmark = (raceId) => {
    return bookmarks.some((race) => race.id === raceId);
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
