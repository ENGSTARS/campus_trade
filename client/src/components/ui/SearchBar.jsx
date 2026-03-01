import { useRef } from 'react';
import { Input } from './Input';

export function SearchBar({ value, onChange, onSearch, placeholder = "Search books, electronics, furniture...", className = "" }) {
  const inputRef = useRef();
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };
  return (
    <div className={`flex items-center w-full gap-2 ${className}`}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search listings"
        className="flex-1 px-4 py-2 rounded-lg border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-200 text-base"
      />
      <button
        type="button"
        aria-label="Search"
        className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg p-2 flex items-center justify-center"
        onClick={() => onSearch && onSearch(value)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
        </svg>
      </button>
    </div>
  );
}
