import React, { useEffect, useRef } from "react";
import { Input } from "./input";
import { Search as SearchIcon } from "lucide-react";

export type SearchBarProps = {
  value: string;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  delay?: number; // ms
  placeholder?: string;
  className?: string; // container
  inputClassName?: string; // input element
  autoFocus?: boolean;
};

// A reusable search input with a left search icon and debounced change callback.
// Immediate changes flow through onChange; debounced updates through onDebouncedChange.
export function SearchBar({
  value,
  onChange,
  onDebouncedChange,
  delay = 300,
  placeholder = "Search...",
  className,
  inputClassName,
  autoFocus,
}: SearchBarProps) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!onDebouncedChange) return;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      onDebouncedChange(value);
    }, delay);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay, onDebouncedChange]);

  return (
    <div className={`relative ${className ?? ""}`.trim()}>
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className={`pl-8 ${inputClassName ?? ""}`.trim()}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        autoFocus={autoFocus}
      />
    </div>
  );
}
