import { Input } from './Input'

export function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-[34px] z-10 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
        Search
      </span>
      <Input
        value={value}
        className="pl-[84px]"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search books, electronics, furniture..."
        aria-label="Search listings"
      />
    </div>
  )
}
