"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { createPlaceholderImage } from "@/lib/storage";
import { resolveProductImage } from "@/lib/product-catalog";
import { Button, Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ProductPicker({
  products,
  value,
  onChange,
  allowAll = false,
  placeholder = "Select product",
  allLabel = "All products",
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const selectedProduct = products.find((item) => item.id === value);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const items = useMemo(() => {
    const list = allowAll
      ? [{ id: "", name: allLabel, category: "", image: createPlaceholderImage(allLabel), unit: "" }, ...products]
      : products;

    const term = query.trim().toLowerCase();
    if (!term) {
      return list;
    }

    return list.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        (item.category || "").toLowerCase().includes(term) ||
        (item.unit || "").toLowerCase().includes(term)
      );
    });
  }, [allowAll, allLabel, products, query]);

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-dark-emerald-100 bg-white px-3 text-left text-sm shadow-sm transition hover:border-black-forest-400 focus:outline-none focus:ring-2 focus:ring-dark-emerald-100 dark:border-black-forest-900/60 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-black-forest-950"
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedProduct ? (
            <img
              src={resolveProductImage(selectedProduct.name, selectedProduct.image)}
              alt={selectedProduct.name}
              className="h-7 w-7 rounded-lg object-cover"
            />
          ) : allowAll ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-dark-emerald-100 text-black-forest-700 dark:bg-black-forest-950 dark:text-dark-emerald-300">
              <Check className="h-4 w-4" />
            </div>
          ) : null}
          <span className="truncate">{selectedProduct ? selectedProduct.name : value ? placeholder : allowAll ? allLabel : placeholder}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <Card className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto p-2 shadow-2xl">
          <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-inherit">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="h-10 pl-10 pr-10"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => {
              const active = String(item.id) === String(value || "");
              return (
                <button
                  key={item.id || "all"}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
                    active
                      ? "border-black-forest-500 bg-dark-emerald-50 dark:border-black-forest-500 dark:bg-black-forest-950/40"
                      : "border-slate-200 hover:border-black-forest-300 dark:border-slate-800 dark:hover:border-black-forest-700"
                  )}
                >
                  <img
                    src={resolveProductImage(item.name, item.image)}
                    alt={item.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.category || item.unit || allLabel}
                    </p>
                  </div>
                  {active ? <Check className="h-4 w-4 text-black-forest-600" /> : null}
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
