import "../css/Race.css";
import { Link } from "react-router-dom";

function Result({ result }) {
  return (
    <Link to={result.driver_url} target="_blank">
      <div className="race">
        <div className="driver-img">
          <img
            src={result.driver_image}
            alt={`${result.driver_forename} ${result.driver_surname}`}
          />
        </div>
        <div className="race-info">
          <h3>
            {result.driver_forename} {result.driver_surname}
          </h3>
          <h4>{result.time}</h4>
          <br />
          Position: {result.position}
          <br />
          Constructor: {result.constructor_name}
          <br />
          Laps: {result.laps}
        </div>
      </div>
    </Link>
  );
}

export default Result;
