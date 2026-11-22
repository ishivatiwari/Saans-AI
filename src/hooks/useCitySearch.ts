import { useEffect, useState } from "react";
import type { Location } from "../../shared/domain";
import { api } from "../lib/api";

/** Debounce input and cancel superseded searches when the query changes. */
export function useCitySearch(query: string) {
  const [results, setResults] = useState<Location[]>([]);
  const [searchStatus, setSearchStatus] = useState("");
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchStatus("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchStatus("Searching cities…");
      try {
        const data = await api.locations(query.trim(), controller.signal);
        if (controller.signal.aborted) return;
        setResults(data);
        setSearchStatus(
          data.length
            ? ""
            : "No cities found. Try a nearby city or a different spelling.",
        );
      } catch (error) {
        if (!controller.signal.aborted)
          setSearchStatus(
            error instanceof Error ? error.message : "Search unavailable.",
          );
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return { results, searchStatus };
}
