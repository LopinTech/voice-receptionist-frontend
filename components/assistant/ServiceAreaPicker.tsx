'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Search, Trash2, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import type { ApiGeoResult, ApiServiceArea } from '@/lib/api-types';

/**
 * MapLibre reaches for `window` at import time, so it must never run during
 * the server render.
 */
const ServiceAreaMap = dynamic(
  () => import('@/components/ui/ServiceAreaMap').then((m) => m.ServiceAreaMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 sm:h-80 rounded-[12px] border border-[#E4E8F0] bg-[#F2F4F8] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#8A93A6]" />
      </div>
    ),
  },
);

interface ServiceAreaPickerProps {
  areas: ApiServiceArea[];
  onChange: (areas: ApiServiceArea[]) => void;
}

const DEFAULT_RADIUS_MILES = 15;
const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 100;
const SEARCH_DEBOUNCE_MS = 350;

export const ServiceAreaPicker: React.FC<ServiceAreaPickerProps> = ({
  areas,
  onChange,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiGeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // The spinner and the cleared results belong to the keystroke that caused
  // them, not to an effect reacting after the fact — setting them here keeps
  // the effect below purely about fetching.
  const onQueryChange = (value: string) => {
    setQuery(value);

    if (value.trim().length < 3) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;

    // Debounced, and the in-flight request is cancelled on every keystroke:
    // the upstream geocoder is rate limited, and a late response arriving
    // after a newer one would show results for a query already replaced.
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      api
        .geoSearch(trimmed, controller.signal)
        .then((found) => {
          setResults(found);
          setIsSearching(false);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setSearchError(
            error instanceof Error
              ? error.message
              : 'Could not search for that location.',
          );
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const addArea = (result: ApiGeoResult) => {
    const id = `${result.lat.toFixed(4)},${result.lng.toFixed(4)}`;

    // Adding the same town twice would draw two identical circles and tell
    // the assistant about it twice.
    if (areas.some((area) => area.id === id)) {
      onQueryChange('');
      return;
    }

    onChange([
      ...areas,
      {
        id,
        label: result.label,
        lat: result.lat,
        lng: result.lng,
        radiusMiles: DEFAULT_RADIUS_MILES,
      },
    ]);

    // Cleared so the next area can be typed straight away — most businesses
    // add several in a row.
    onQueryChange('');
  };

  const setRadius = (id: string, radiusMiles: number) => {
    onChange(
      areas.map((area) => (area.id === id ? { ...area, radiusMiles } : area)),
    );
  };

  const removeArea = (id: string) => {
    onChange(areas.filter((area) => area.id !== id));
    if (highlightedId === id) setHighlightedId(null);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A93A6]" />
        <input
          id="service-area-search"
          aria-label="Search for a service area"
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search a city, town, neighbourhood or ZIP…"
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#FCFCFD] border border-[#E4E8F0] text-xs sm:text-sm text-[#0E1526] focus:outline-none focus:ring-4 focus:ring-[#2F6BFF]"
        />
        {isSearching && (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8A93A6] animate-spin" />
        )}
        {!isSearching && query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A93A6] hover:text-[#5C6579] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searchError && (
        <p className="text-[11px] text-rose-600 font-medium">
          {searchError}
        </p>
      )}

      {results.length > 0 && (
        <div className="rounded-[12px] border border-[#E4E8F0] bg-white divide-y divide-[#EEF0F5] overflow-hidden shadow-sm">
          {results.map((result) => (
            <button
              key={`${result.lat},${result.lng}`}
              type="button"
              onClick={() => addArea(result)}
              className="w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 hover:bg-[#1E4FD8]/10 cursor-pointer"
            >
              <span className="text-[#26304A] truncate">
                {result.label}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A93A6] shrink-0">
                {result.kind}
              </span>
            </button>
          ))}
        </div>
      )}

      {!isSearching && query.trim().length >= 3 && results.length === 0 && !searchError && (
        <p className="text-[11px] text-[#8A93A6]">
          No places matched &ldquo;{query.trim()}&rdquo;.
        </p>
      )}

      {/* Selected areas */}
      {areas.length === 0 ? (
        <p className="text-[11px] text-[#8A93A6]">
          No service areas yet. Search above to add the places you cover — your
          assistant uses these to tell callers whether you come out to them.
        </p>
      ) : (
        <div className="space-y-2">
          {areas.map((area) => (
            <div
              key={area.id}
              onMouseEnter={() => setHighlightedId(area.id)}
              onMouseLeave={() => setHighlightedId(null)}
              className={`p-3 rounded-[12px] border transition-colors ${
                highlightedId === area.id
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-[#FCFCFD] border-[#E4E8F0] '
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#0E1526] truncate">
                  {area.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeArea(area.id)}
                  aria-label={`Remove ${area.label}`}
                  className="p-1 rounded-lg text-[#8A93A6] hover:text-rose-500 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={MIN_RADIUS_MILES}
                  max={MAX_RADIUS_MILES}
                  step={1}
                  value={area.radiusMiles}
                  aria-label={`Service radius around ${area.label}, in miles`}
                  onChange={(event) =>
                    setRadius(area.id, Number(event.target.value))
                  }
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <span className="text-[11px] font-mono font-bold text-[#5C6579] tabular-nums w-14 text-right shrink-0">
                  {area.radiusMiles} mi
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceAreaMap areas={areas} highlightedId={highlightedId} />
    </div>
  );
};
