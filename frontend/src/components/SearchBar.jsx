import { forwardRef, useState, useRef, useEffect, useCallback, useImperativeHandle } from "react";
import client from "../api/client";

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0 text-slate-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  );
}

const SearchBar = forwardRef(function SearchBar({ onSearch, loading }, ref) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

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
      <form
        onSubmit={handleSubmit}
        className="flex h-14 w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B0D14] pl-4 pr-1.5 transition-all focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.08)]"
      >
        <SearchIcon />
        <input
          ref={inputRef}
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
          className="h-full min-w-0 flex-1 bg-transparent text-base text-white placeholder-slate-500 outline-none"
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-blue-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#12141D] shadow-2xl">
          {suggestions.map((s, idx) => (
            <button
              key={s.ticker}
              type="button"
              onClick={() => runSearch(s.ticker)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                idx === highlightedIndex ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="font-bold text-white">{s.ticker}</span>
                <span className="truncate text-sm text-slate-400">{s.name}</span>
              </div>
              {s.sector && (
                <span className="flex-shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {s.sector}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default SearchBar;
