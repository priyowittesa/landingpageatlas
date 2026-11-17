"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import FormFieldLayout from "@/components/FormFieldLayout";
import { cn } from "@/lib/utils";

export interface LazySelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  disabledLabel?: string;
}

export interface LazySelectProps {
  label: string;
  name: string;
  /** Selected value (controlled). */
  value?: string;
  /** Called when the user picks an option. */
  onChange?: (value: string) => void;
  /** Called when the popover open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Already-fetched options. */
  options: LazySelectOption[];
  /** Total options currently loaded. */
  totalLoaded: number;
  /** True while the first page is loading. */
  isLoading: boolean;
  /** True while the next page is loading. */
  isFetchingNextPage: boolean;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Trigger to load the next page. */
  onLoadMore: () => void;
  /** Optional debounced search hook. */
  onSearchChange?: (search: string) => void;
  search?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  desc?: string;
  className?: string;
  /** Render a "clear" button. */
  clearable?: boolean;
  /** Label for the manual load more button. */
  loadMoreLabel?: string;
}

export function LazySelect({
  label,
  name,
  value,
  onChange,
  onOpenChange,
  options,
  isLoading,
  isFetchingNextPage,
  hasMore,
  onLoadMore,
  onSearchChange,
  search: externalSearch,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  required = false,
  error,
  disabled = false,
  desc,
  className,
  clearable = false,
  loadMoreLabel = "Load more",
}: LazySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalSearch, setInternalSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const resultsRef = React.useRef<HTMLDivElement | null>(null);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) setInternalSearch("");
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const searchValue =
    externalSearch !== undefined ? externalSearch : internalSearch;

  React.useEffect(() => {
    if (open && resultsRef.current) resultsRef.current.scrollTop = 0;
  }, [open, searchValue]);

  const handleSearchChange = (next: string) => {
    if (onSearchChange) {
      onSearchChange(next);
    } else {
      setInternalSearch(next);
    }
  };

  const selectedOption = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const handleSelect = (next: string) => {
    onChange?.(next);
    setOpen(false);
  };

  // Filter locally when no server-side search handler is provided.
  const filteredOptions = React.useMemo(() => {
    if (onSearchChange) return options;
    const q = internalSearch.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, internalSearch, onSearchChange]);

  // Click outside closes the panel.
  React.useEffect(() => {
    if (!open) return;
    function onDocPointerDown(event: PointerEvent) {
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open]);

  // Escape closes the panel.
  React.useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLoadMore = () => {
    if (!isFetchingNextPage && hasMore) onLoadMore();
  };

  return (
    <FormFieldLayout
      label={label}
      htmlFor={name}
      required={required}
      error={error}
      desc={desc}
      className={className}
    >
      <div ref={containerRef} className="relative flex min-w-0 w-full gap-2">
        <button
          id={name}
          type="button"
          disabled={disabled}
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (!disabled) handleOpenChange(!open);
          }}
          className={cn(
            "flex min-h-10 min-w-0 w-full items-center justify-between gap-2 overflow-hidden rounded-sm border px-4 py-2 text-left text-sm",
            error && "border-red-500",
            !selectedOption && "text-gray-400",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gray-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {clearable && value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onChange?.("")}
            className="h-10 w-10 shrink-0 text-gray-500 hover:border-gray-200 hover:text-gray-700"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {open && !disabled && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
          >
            <div className="border-b border-gray-100 p-2">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-sm border border-gray-200 px-3 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div ref={resultsRef} className="max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-gray-400">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:text-gray-400",
                        isSelected
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:bg-gray-50 disabled:hover:bg-white",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {option.disabledLabel ? (
                        <span className="shrink-0 text-[10px] font-medium text-red-500">
                          {option.disabledLabel}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {/* Load more — outside the scroll list so click handlers
                are never swallowed by cmdk / scroll container. */}
            {!isLoading && filteredOptions.length > 0 && (
              <div className="border-t border-gray-100 bg-white p-2">
                {hasMore ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFetchingNextPage}
                    onClick={handleLoadMore}
                    className="h-8 w-full text-xs"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      loadMoreLabel
                    )}
                  </Button>
                ) : (
                  <p className="py-1 text-center text-[10px] text-gray-400">
                    All {filteredOptions.length} options loaded
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {desc && !error && (
        <span className="text-[10px] text-muted-foreground">{desc}</span>
      )}
    </FormFieldLayout>
  );
}

export default LazySelect;
