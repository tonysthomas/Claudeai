// Search input with a clear button. Controlled by the parent.
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  return (
    <div className="relative">
      <label htmlFor="product-search" className="sr-only">
        Search products by SKU, style number, or name
      </label>
      <input
        id="product-search"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Search by SKU, style number, or name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-base shadow-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
      />
      {value !== '' && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
