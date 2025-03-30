import "./css/App.css";
import Home from "./pages/Home";
import Bookmarks from "./pages/Bookmarks";
import RaceData from "./pages/RaceData";
import { Routes, Route } from "react-router-dom";
import { ContextProvider } from "./context/BookmarkContext";
import NavBar from "./components/NavBar";

function App() {
  return (
    <ContextProvider>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/races/:raceId" element={<RaceData />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
        </Routes>
      </main>
    </ContextProvider>
  );
}

export default App;
