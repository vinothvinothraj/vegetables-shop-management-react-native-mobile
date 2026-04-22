"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { useApp } from "@/context/app-context";
import { Badge, Card, EmptyState, Input, SectionTitle, Select, StatCard, TableShell } from "@/components/ui";
import { resolveProductImage } from "@/lib/product-catalog";

export default function StockPage() {
  const { stockByProduct, purchases, sales, t } = useApp();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = stockByProduct.filter((item) =>
      item.vegetableName.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
    );

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.vegetableName.localeCompare(a.vegetableName);
        case "name-asc":
          return a.vegetableName.localeCompare(b.vegetableName);
        case "remaining-desc":
          return b.remaining - a.remaining;
        case "remaining-asc":
          return a.remaining - b.remaining;
        default:
          return 0;
      }
    });

    return list;
  }, [query, sortBy, stockByProduct]);

  const totalPurchased = purchases.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalSold = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0),
    0
  );
  const totalRemaining = stockByProduct.reduce((sum, item) => sum + Number(item.remaining || 0), 0);

  return (
    <div className="space-y-6 pb-20">

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("totalPurchased")} value={`${totalPurchased} kg`} accent="dark-emerald" />
        <StatCard label={t("totalSold")} value={`${totalSold} kg`} accent="turf-green" />
        <StatCard label={t("remainingStock")} value={`${totalRemaining} kg`} accent="black-forest" />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">{t("searchVegetable")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${t("search")}...`}
              />
            </div>
          </div>
          <div className="sm:w-44">
            <label className="mb-2 block text-sm font-medium">{t("sort")}</label>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name-asc">{t("nameAZ")}</option>
              <option value="name-desc">{t("nameZA")}</option>
              <option value="remaining-desc">{t("highestTotal")}</option>
              <option value="remaining-asc">{t("lowestTotal")}</option>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={t("noStockEntriesFound")} description={t("stockRowsAppearAutomatically")} />
        ) : (
          <TableShell>
            <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("product")}</th>
                  <th className="px-4 py-3 font-medium">{t("purchased")}</th>
                  <th className="px-4 py-3 font-medium">{t("sold")}</th>
                  <th className="px-4 py-3 font-medium">{t("remaining")}</th>
                  <th className="px-4 py-3 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.productId || item.vegetableName} className="border-t border-slate-200 align-top dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(item.vegetableName, item.image)}
                          alt={item.vegetableName}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-medium">{item.vegetableName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.category || item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.purchased} kg</td>
                    <td className="px-4 py-3">{item.sold} kg</td>
                    <td className="px-4 py-3 font-semibold">{item.remaining} kg</td>
                    <td className="px-4 py-3">
                      {item.remaining <= 5 ? (
                        <Badge variant="danger">
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                          {t("lowStock")}
                        </Badge>
                      ) : (
                        <Badge variant="success">{t("healthy")}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
