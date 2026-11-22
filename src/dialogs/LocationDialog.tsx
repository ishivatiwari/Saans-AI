import { ArrowRight, Earth, MapPin, Search } from "lucide-react";
import type * as React from "react";
import { cities, type Location } from "../../shared/domain";
import { Modal } from "../components/Primitives";
import type { ModalName } from "../types";

interface LocationDialogProps {
  setModal: React.Dispatch<React.SetStateAction<ModalName>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  searchStatus: string;
  results: Location[];
  selectLocation: (next: Location) => void;
}
export function LocationDialog({
  setModal,
  query,
  setQuery,
  searchStatus,
  results,
  selectLocation,
}: LocationDialogProps) {
  return (
    <Modal title="Find your breathing space" close={() => setModal(null)}>
      <p className="modal-description">
        Search any city worldwide. Air-quality coverage and model resolution
        vary by location.
      </p>
      <div className="search-field">
        <Search size={18} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city, anywhere in the world"
          maxLength={80}
          aria-label="Search cities"
        />
      </div>
      <p className="tiny muted" role="status">
        {searchStatus ||
          (query.length < 2 ? "FEATURED CITIES" : "SEARCH RESULTS")}
      </p>
      <div className="city-results">
        {(query.length >= 2 ? results : cities).map((city, i) => (
          <button
            key={`${city.latitude}-${city.longitude}-${i}`}
            onClick={() => selectLocation(city)}
          >
            <span className="city-pin">
              <MapPin size={18} />
            </span>
            <span>
              <strong>{city.name}</strong>
              <small>{city.country}</small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="location-foot">
        <Earth size={15} />
        City-level context. No precise location tracking.
      </div>
    </Modal>
  );
}
