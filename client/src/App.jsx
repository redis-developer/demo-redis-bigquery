import "./css/App.css";
import Races from "./pages/Races.jsx";
import Bookmarks from "./pages/Bookmarks.jsx";
import Race from "./pages/Race.jsx";
import { Routes, Route } from "react-router-dom";
import { ContextProvider } from "./context/BookmarkContext.jsx";
import NavBar from "./components/NavBar.jsx";

function App() {
  return (
    <ContextProvider>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Races />} />
          <Route path="/races/:raceId" element={<Race />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
        </Routes>
      </main>
    </ContextProvider>
  );
}

export default App;
