import { useState, useRef, useEffect, useCallback } from "react";
import client from "../api/client";

function SearchIcon({ pulse }) {
  return (
    <svg
      className={`h-5 w-5 text-blue-400/60 transition-transform ${pulse ? "animate-soft-pulse" : ""}`}
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
  const [focused, setFocused] = useState(false);
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
      <div
        className={`pointer-events-none absolute inset-0 animate-gradient rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-xl transition-opacity duration-500 ${
          focused ? "opacity-100" : "opacity-0"
        }`}
      />
      <form onSubmit={handleSubmit} className="relative z-10 flex w-full gap-3">
        <div className="glass relative flex-1 rounded-2xl border border-white/10 transition-all duration-300 hover:border-white/15 focus-within:border-blue-500/40 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon pulse={!focused && !value} />
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowDropdown(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              setFocused(true);
              setShowDropdown(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Search by company name or ticker..."
            className="h-14 w-full rounded-2xl bg-transparent pl-12 pr-4 text-lg text-white placeholder-slate-500 outline-none"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:from-blue-400 hover:to-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="glass absolute z-20 mt-2 w-full overflow-hidden rounded-2xl shadow-2xl">
          {suggestions.map((s, idx) => (
            <button
              key={s.ticker}
              type="button"
              onClick={() => runSearch(s.ticker)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                idx === highlightedIndex ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="font-bold text-white">{s.ticker}</span>
                <span className="truncate text-sm text-slate-400">{s.name}</span>
              </div>
              {s.sector && (
                <span className="flex-shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {s.sector}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
