"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function StickerPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState("trending");
  const [query, setQuery] = useState("");
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pickerRef = useRef(null);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  // Fetch stickers
  const fetchStickers = useCallback(async (searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const url = searchQuery
        ? `/api/stickers?q=${encodeURIComponent(searchQuery)}&limit=24`
        : `/api/stickers?limit=24`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStickers(data.stickers || []);
    } catch (e) {
      setError("Could not load stickers");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending on mount / tab switch
  useEffect(() => {
    if (tab === "trending") {
      setQuery("");
      fetchStickers(null);
    } else {
      searchRef.current?.focus();
      if (query.trim()) {
        fetchStickers(query.trim());
      } else {
        setStickers([]);
        setLoading(false);
      }
    }
  }, [tab, fetchStickers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer.current);
    if (val.trim()) {
      debounceTimer.current = setTimeout(() => fetchStickers(val.trim()), 350);
    } else {
      setStickers([]);
    }
  };

  return (
    <div ref={pickerRef} className="sp">
      {/* Header with tabs */}
      <div className="sp__tabs">
        <button
          className={`sp__tab ${tab === "trending" ? "sp__tab--active" : ""}`}
          onClick={() => setTab("trending")}
        >
          🔥 Trending
        </button>
        <button
          className={`sp__tab ${tab === "search" ? "sp__tab--active" : ""}`}
          onClick={() => setTab("search")}
        >
          🔍 Search
        </button>
      </div>

      {/* Search input */}
      {tab === "search" && (
        <div className="sp__search-wrapper">
          <input
            ref={searchRef}
            className="sp__search"
            type="text"
            placeholder="Search stickers…"
            value={query}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>
      )}

      {/* Sticker grid */}
      <div className="sp__body">
        {loading ? (
          <div className="sp__grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="sp__skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="sp__empty">{error}</div>
        ) : stickers.length === 0 ? (
          <div className="sp__empty">
            {tab === "search" && !query.trim()
              ? "Type to search stickers"
              : "No stickers found"}
          </div>
        ) : (
          <div className="sp__grid">
            {stickers.map((s) => (
              <img
                key={s.id}
                src={s.preview}
                alt="sticker"
                className="sp__sticker"
                onClick={() => onSelect(s.url)}
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>

      {/* GIPHY attribution */}
      <div className="sp__attribution">
        <img
          src="https://giphy.com/static/img/poweredby_giphy.png"
          alt="Powered by GIPHY"
          height="14"
        />
      </div>
    </div>
  );
}
