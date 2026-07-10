import { useState, useRef, useEffect, useCallback } from "react";
import client from "../api/client";

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  );
}

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await client.get("/search-suggestions", { params: { q: query } });
      setSuggestions(res.data);
    } catch (err) {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runSearch = (ticker) => {
    if (!ticker) return;
    setShowDropdown(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSearch(ticker.trim().toUpperCase());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      runSearch(suggestions[highlightedIndex].ticker);
    } else {
      runSearch(value);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowDropdown(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search by company name or ticker..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-3 pl-11 pr-4 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
          {suggestions.map((s, idx) => (
            <button
              key={s.ticker}
              type="button"
              onClick={() => runSearch(s.ticker)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition ${
                idx === highlightedIndex ? "bg-gray-700" : "hover:bg-gray-750"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-bold text-gray-100">{s.ticker}</span>
                <span className="truncate text-sm text-gray-400">{s.name}</span>
              </div>
              {s.sector && (
                <span className="flex-shrink-0 text-xs text-gray-500">{s.sector}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
