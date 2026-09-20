'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';

export interface ComboboxGroup {
  label: string;
  options: string[];
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  groups: ComboboxGroup[];
  placeholder?: string;
  /**
   * When set, anything typed that matches no option can be chosen as-is,
   * using this as the row's label. Without it the field is a closed list.
   */
  customLabel?: (query: string) => string;
  id?: string;
}

/**
 * A searchable select in the app's own styling — typed filtering, arrow-key
 * navigation, Enter to choose, Escape to dismiss — with an explicit row for
 * using whatever was typed, so a value outside the list is a deliberate
 * choice rather than an accident.
 */
export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  groups,
  placeholder = 'Search…',
  customLabel,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flat list of what is actually selectable right now; the rendered groups
  // and the keyboard cursor have to agree on this ordering.
  const { visibleGroups, flatOptions, showCustom } = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = groups
      .map((group) => ({
        label: group.label,
        options: needle
          ? group.options.filter((option) =>
              option.toLowerCase().includes(needle),
            )
          : group.options,
      }))
      .filter((group) => group.options.length > 0);

    const flat = filtered.flatMap((group) => group.options);
    const isExisting = flat.some((option) => option.toLowerCase() === needle);

    return {
      visibleGroups: filtered,
      flatOptions: flat,
      showCustom: Boolean(customLabel) && needle.length > 0 && !isExisting,
    };
  }, [groups, query, customLabel]);

  const optionCount = flatOptions.length + (showCustom ? 1 : 0);

  const open = () => {
    setIsOpen(true);
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const choose = (next: string) => {
    onChange(next);
    close();
  };

  // Dismiss on an outside click; a select that traps focus is worse than one
  // that closes when you look away.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  // Keep the highlighted row in view when arrowing past the visible window.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const chooseIndex = (index: number) => {
    if (index < flatOptions.length) return choose(flatOptions[index]);
    if (showCustom) return choose(query.trim());
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (optionCount === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => (current + step + optionCount) % optionCount);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      chooseIndex(activeIndex);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => (isOpen ? close() : open())}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <span
          className={
            value
              ? 'text-slate-900 dark:text-white truncate'
              : 'text-slate-400 truncate'
          }
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Type to search…"
                className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div
            ref={listRef}
            className="max-h-64 overflow-y-auto p-1.5"
            role="listbox"
          >
            {optionCount === 0 && (
              <p className="px-2.5 py-3 text-xs text-slate-400 text-center">
                Nothing matches &ldquo;{query}&rdquo;.
              </p>
            )}

            {visibleGroups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {group.label}
                </div>
                {group.options.map((option) => {
                  const index = flatOptions.indexOf(option);
                  const isActive = index === activeIndex;
                  const isSelected = option === value;

                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(option)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {showCustom && customLabel && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                data-active={activeIndex === flatOptions.length}
                onMouseEnter={() => setActiveIndex(flatOptions.length)}
                onClick={() => choose(query.trim())}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1 pt-2.5 cursor-pointer ${
                  activeIndex === flatOptions.length
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{customLabel(query.trim())}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
