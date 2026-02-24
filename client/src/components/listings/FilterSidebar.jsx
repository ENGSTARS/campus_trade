import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CAMPUS_OPTIONS, CATEGORY_OPTIONS, CONDITION_OPTIONS, TYPE_OPTIONS } from '@/utils/constants'

export function FilterSidebar({ filters, onChange, onReset }) {
  return (
    <aside className="card-surface h-fit space-y-4 p-4 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-slate-900">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
      <p className="text-xs text-slate-500">Refine by campus, category, condition, type, and budget.</p>

      <Select
        label="Campus"
        value={filters.campus}
        onChange={(event) => onChange({ campus: event.target.value })}
        options={[{ value: 'all', label: 'All campuses' }, ...CAMPUS_OPTIONS.map((campus) => ({ value: campus, label: campus }))]}
      />

      <Select
        label="Category"
        value={filters.category}
        onChange={(event) => onChange({ category: event.target.value })}
        options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS.map((item) => ({ value: item, label: item }))]}
      />

      <Select
        label="Condition"
        value={filters.condition}
        onChange={(event) => onChange({ condition: event.target.value })}
        options={[{ value: 'all', label: 'All conditions' }, ...CONDITION_OPTIONS.map((item) => ({ value: item, label: item }))]}
      />

      <Select
        label="Type"
        value={filters.type}
        onChange={(event) => onChange({ type: event.target.value })}
        options={[
          { value: 'all', label: 'All types' },
          ...TYPE_OPTIONS.map((item) => ({
            value: item,
            label: item === 'SECOND_HAND' ? 'Second Hand' : 'New',
          })),
        ]}
      />

      <Input
        label="Min price"
        type="number"
        value={filters.minPrice}
        onChange={(event) => onChange({ minPrice: event.target.value })}
        placeholder="0"
      />

      <Input
        label="Max price"
        type="number"
        value={filters.maxPrice}
        onChange={(event) => onChange({ maxPrice: event.target.value })}
        placeholder="500"
      />
    </aside>
  )
}
