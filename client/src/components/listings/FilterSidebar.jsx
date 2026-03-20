import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CAMPUS_OPTIONS, CATEGORY_OPTIONS, CONDITION_OPTIONS, TYPE_OPTIONS } from '@/utils/constants'

export function FilterSidebar({ filters, onChange, onReset }) {
  return (
    <aside className="card-surface h-fit p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-slate-900">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
        <Select label="Campus" value={filters.campus} onChange={e => onChange({ campus: e.target.value })} options={[{ value: 'all', label: 'All campuses' }, ...CAMPUS_OPTIONS.map(campus => ({ value: campus, label: campus }))]} />
        <Select label="Category" value={filters.category} onChange={e => onChange({ category: e.target.value })} options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS.map(item => ({ value: item, label: item }))]} />
        <Select label="Condition" value={filters.condition} onChange={e => onChange({ condition: e.target.value })} options={[{ value: 'all', label: 'All conditions' }, ...CONDITION_OPTIONS.map(item => ({ value: item, label: item }))]} />
        <Select label="Type" value={filters.type} onChange={e => onChange({ type: e.target.value })} options={[{ value: 'all', label: 'All types' }, ...TYPE_OPTIONS.map(item => ({ value: item, label: item === 'SECOND_HAND' ? 'Second Hand' : 'New' }))]} />
        <Input label="Min price" type="number" value={filters.minPrice} onChange={e => onChange({ minPrice: e.target.value })} placeholder="0" />
        <Input label="Max price" type="number" value={filters.maxPrice} onChange={e => onChange({ maxPrice: e.target.value })} placeholder="500" />
      </div>
    </aside>
  )
}
