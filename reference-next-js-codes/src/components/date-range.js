"use client";

import { Input, Select } from "@/components/ui";

export function DateRangeFilter({ value, onChange, label = "Date" }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export function SortSelect({ value, onChange, options }) {
  return (
    <div className="min-w-40">
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Sort</label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
