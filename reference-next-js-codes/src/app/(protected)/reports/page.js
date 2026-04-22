"use client";

import { useMemo, useState } from "react";
import { Download, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Printer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, Input, Select, StatCard, TableShell } from "@/components/ui";
import { ProductPicker } from "@/components/product-picker";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { resolveProductImage } from "@/lib/product-catalog";
import { demoDefaultReportDate } from "@/lib/demo-data";

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getMonthKey(date) {
  const next = new Date(date);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
  }).format(new Date(date));
}

function getStartOfMonthOffset(baseDate, offset) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() - offset, 1);
}

const SALES_PALETTE = [
  "hsl(142 72% 29%)",
  "hsl(160 84% 39%)",
  "hsl(158 64% 52%)",
  "hsl(164 75% 30%)",
  "hsl(152 71% 42%)",
  "hsl(155 50% 32%)",
  "hsl(146 63% 35%)",
  "hsl(168 84% 28%)",
];

export default function ReportsPage() {
  const { products, purchases, sales, expenses, reportsForDate, reportsForMonth, formatCurrency, t } = useApp();
  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState(demoDefaultReportDate);
  const [productId, setProductId] = useState("");
  const [chartView, setChartView] = useState("bar");

  const report = useMemo(() => {
    return period === "monthly" ? reportsForMonth(date, productId) : reportsForDate(date, productId);
  }, [date, period, productId, reportsForDate, reportsForMonth]);

  const selectedProduct = products.find((item) => item.id === productId);
  const profit = report.salesTotal - report.purchaseTotal - report.expensesTotal;

  const chartData = [
    {
      label: t("purchases"),
      value: report.purchaseTotal,
      fill: "hsl(199 89% 48%)",
    },
    {
      label: t("sales"),
      value: report.salesTotal,
      fill: "hsl(142 72% 29%)",
    },
    {
      label: t("expenses"),
      value: report.expensesTotal,
      fill: "hsl(38 92% 50%)",
    },
    {
      label: t("profit"),
      value: profit,
      fill: profit >= 0 ? "hsl(142 72% 29%)" : "hsl(0 84% 60%)",
    },
  ];

  const chartConfig = {
    value: {
      label: t("total"),
      color: "hsl(160 84% 39%)",
    },
  };

  const trendData = useMemo(() => {
    const now = new Date(date);
    const lookup = new Map();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const month = getStartOfMonthOffset(now, offset);
      const key = getMonthKey(month);
      lookup.set(key, {
        label: getMonthLabel(month),
        purchases: 0,
        sales: 0,
        expenses: 0,
        profit: 0,
      });
    }

    purchases.forEach((item) => {
      const key = getMonthKey(item.date);
      if (!lookup.has(key)) return;
      lookup.get(key).purchases += Number(item.total || 0);
    });

    sales.forEach((item) => {
      const key = getMonthKey(item.date);
      if (!lookup.has(key)) return;
      lookup.get(key).sales += Number(item.grandTotal || 0);
    });

    expenses.forEach((item) => {
      const key = getMonthKey(item.date);
      if (!lookup.has(key)) return;
      lookup.get(key).expenses += Number(item.amount || 0);
    });

    return Array.from(lookup.values()).map((item) => ({
      ...item,
      profit: item.sales - item.purchases - item.expenses,
    }));
  }, [date, expenses, purchases, sales]);

  const productSalesData = useMemo(() => {
    const totals = new Map();

    report.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = totals.get(item.productName) || {
          name: item.productName,
          value: 0,
          fill: "",
        };

        current.value += Number(item.total || 0);
        current.fill = products.find((product) => product.name === item.productName)?.image
          ? "hsl(160 84% 39%)"
          : "hsl(142 72% 29%)";
        totals.set(item.productName, current);
      });
    });

    return Array.from(totals.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((entry, index) => ({
        ...entry,
        fill: SALES_PALETTE[index % SALES_PALETTE.length],
      }));
  }, [products, report.sales]);

  const trendConfig = {
    purchases: { label: t("purchases"), color: "hsl(199 89% 48%)" },
    sales: { label: t("sales"), color: "hsl(142 72% 29%)" },
    expenses: { label: t("expenses"), color: "hsl(38 92% 50%)" },
    profit: { label: t("profit"), color: "hsl(160 84% 39%)" },
  };

  const exportReport = () => {
    const rows = [
      [t("reportTitle"), period, date, selectedProduct?.name || t("allProducts")],
      [t("type"), t("date"), t("product"), t("total")],
      ...report.purchases.map((item) => [t("purchases"), item.date, item.vegetableName, item.total]),
      ...report.sales.flatMap((sale) =>
        sale.items.map((item) => [
          t("sales"),
          sale.date,
          `${sale.customerName || t("walkInCustomer")} - ${item.productName} x ${item.qty}`,
          item.total,
        ])
      ),
      ...report.expenses.map((item) => [
        t("expenses"),
        item.date,
        `${item.type}${item.note ? ` - ${item.note}` : ""}`,
        item.amount,
      ]),
      [t("product"), "", t("purchases"), report.purchaseTotal],
      [t("product"), "", t("sales"), report.salesTotal],
      [t("product"), "", t("expenses"), report.expensesTotal],
      [t("product"), "", t("profit"), profit],
    ];

    downloadCsv(`veg-shop-report-${period}-${date}.csv`, rows);
    toast.success(t("reportExportedCsv"));
  };

  const printReport = () => {
    window.print();
  };

  return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportReport}
            className="flex-1 border border-dark-emerald-200 bg-dark-emerald-50 text-black-forest-900 shadow-sm hover:bg-dark-emerald-100 dark:border-black-forest-900/60 dark:bg-black-forest-950/40 dark:text-dark-emerald-100 dark:hover:bg-black-forest-950 sm:flex-none"
          >
            <Download className="h-4 w-4" />
            <span className="whitespace-nowrap">{t("csvExport")}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={printReport}
            className="flex-1 border border-black-forest-200 bg-black-forest-700 text-white shadow-sm hover:bg-black-forest-800 dark:border-dark-emerald-900/50 dark:bg-dark-emerald-700 dark:text-white dark:hover:bg-dark-emerald-600 sm:flex-none"
          >
            <Printer className="h-4 w-4" />
            <span className="whitespace-nowrap">{t("printPdf")}</span>
          </Button>
        </div>

      <div className="no-print space-y-6">
        <Card className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("period")}</label>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="daily">{t("daily")}</option>
                <option value="monthly">{t("monthly")}</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                {period === "monthly" ? t("anyDateWithinMonth") : t("date")}
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("productFilter")}</label>
              <ProductPicker
                products={products}
                value={productId}
                onChange={setProductId}
                allowAll
                placeholder={t("allProducts")}
                allLabel={t("allProducts")}
              />
            </div>
          </div>

          {selectedProduct ? (
            <div className="flex items-center gap-3 rounded-xl bg-dark-emerald-50 p-3 dark:bg-black-forest-950/40">
              <img
                src={resolveProductImage(selectedProduct.name, selectedProduct.image)}
                alt={selectedProduct.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div>
                <p className="text-sm font-semibold">{selectedProduct.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedProduct.category || t("general")}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label={t("purchases")}
              value={formatCurrency(report.purchaseTotal)}
              hint={`${report.purchases.length} ${t("entries")}`}
              accent="dark-emerald"
            />
            <StatCard
              label={t("sales")}
              value={formatCurrency(report.salesTotal)}
              hint={`${report.sales.length} ${t("salesBills")}`}
              accent="black-forest"
            />
            <StatCard
              label={t("expenses")}
              value={formatCurrency(report.expensesTotal)}
              hint={`${report.expenses.length} ${t("entries")}`}
              accent="turf-green"
            />
            <StatCard
              label={t("profit")}
              value={formatCurrency(profit)}
              hint={t("salesMinusPurchasesExpenses")}
              accent={profit >= 0 ? "jade-green" : "rose"}
            />
          </div>

          <Card className="space-y-4 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">{t("performanceSnapshot")}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("salesMinusPurchasesExpenses")}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant={chartView === "bar" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setChartView("bar")}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Bar</span>
                </Button>
                <Button
                  type="button"
                  variant={chartView === "pie" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setChartView("pie")}
                >
                  <PieChartIcon className="h-4 w-4" />
                  <span>Pie</span>
                </Button>
                <Button
                  type="button"
                  variant={chartView === "line" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setChartView("line")}
                >
                  <LineChartIcon className="h-4 w-4" />
                  <span>Line</span>
                </Button>
              </div>
            </div>

            <ChartContainer config={chartConfig} className="h-[220px] w-full overflow-hidden sm:h-[260px] md:h-[280px]">
              {chartView === "pie" ? (
                <PieChart margin={{ top: 10, right: 8, bottom: 0, left: 8 }}>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value), name]} />} />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="48%"
                    outerRadius="80%"
                    paddingAngle={4}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              ) : chartView === "line" ? (
                <LineChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={60}
                    tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, "")}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <ChartTooltip
                    cursor={{ stroke: "rgba(16, 185, 129, 0.18)" }}
                    content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value), name]} />}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(160 84% 39%)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={60}
                    tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, "")}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                    content={
                      <ChartTooltipContent formatter={(value, name) => [formatCurrency(value), name]} />
                    }
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ChartContainer>
            <div className="flex items-center justify-end">
              <Badge variant="success">{period === "monthly" ? t("monthlyView") : t("dailyView")}</Badge>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
            <Card className="space-y-4 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">{t("monthlyTrend")}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("lastSixMonthsTrend")}</p>
                </div>
                <Badge variant="success" className="self-start sm:self-auto">
                  {t("monthlyView")}
                </Badge>
              </div>

              <ChartContainer config={trendConfig} className="h-[220px] w-full overflow-hidden sm:h-[260px] md:h-[280px]">
                <LineChart data={trendData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={60}
                    tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, "")}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value), name]} />} />
                  <Line type="monotone" dataKey="sales" stroke={trendConfig.sales.color} strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="purchases" stroke={trendConfig.purchases.color} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="profit" stroke={trendConfig.profit.color} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </Card>

            <Card className="space-y-4 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">{t("productWiseSales")}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("topSoldProducts")}</p>
                </div>
                <Badge variant="success" className="self-start sm:self-auto">
                  {productSalesData.length}
                </Badge>
              </div>

              <ChartContainer config={chartConfig} className="h-[220px] w-full overflow-hidden sm:h-[260px] md:h-[280px]">
                <PieChart margin={{ top: 10, right: 8, bottom: 0, left: 8 }}>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value), name]} />} />
                  <Pie
                    data={productSalesData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="44%"
                    outerRadius="78%"
                    paddingAngle={3}
                  >
                    {productSalesData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.fill || "hsl(160 84% 39%)"}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </Card>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{t("purchases")}</h3>
              <Badge>{report.purchases.length}</Badge>
            </div>
            <TableShell>
              <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("date")}</th>
                    <th className="px-4 py-3 font-medium">{t("product")}</th>
                    <th className="px-4 py-3 font-medium">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.purchases.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">{item.vegetableName}</td>
                      <td className="px-4 py-3">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{t("sales")}</h3>
              <Badge>{report.sales.length}</Badge>
            </div>
            <TableShell>
              <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("date")}</th>
                    <th className="px-4 py-3 font-medium">{t("customer")}</th>
                    <th className="px-4 py-3 font-medium">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">{item.customerName || t("walkInCustomer")}</td>
                      <td className="px-4 py-3">{formatCurrency(item.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{t("expenses")}</h3>
              <Badge>{report.expenses.length}</Badge>
            </div>
            <TableShell>
              <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("date")}</th>
                    <th className="px-4 py-3 font-medium">{t("type")}</th>
                    <th className="px-4 py-3 font-medium">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">{item.type}</td>
                      <td className="px-4 py-3">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </Card>
        </div>
      </div>

      <div className="hidden print:block">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{t("reportTitle")}</h1>
          <p className="text-sm text-slate-600">
            {period === "monthly" ? t("monthly") : t("daily")} {t("reports")} {date}
            {selectedProduct ? ` - ${selectedProduct.name}` : ""}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-slate-500">{t("purchases")}</p>
            <p className="text-lg font-semibold">{formatCurrency(report.purchaseTotal)}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-slate-500">{t("sales")}</p>
            <p className="text-lg font-semibold">{formatCurrency(report.salesTotal)}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-slate-500">{t("expenses")}</p>
            <p className="text-lg font-semibold">{formatCurrency(report.expensesTotal)}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-slate-500">{t("profit")}</p>
            <p className="text-lg font-semibold">{formatCurrency(profit)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("summaryTables")}</h2>
          <p className="text-sm text-slate-500">{t("printedVersionOptimized")}</p>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border p-3">
              <h3 className="mb-2 font-semibold">{t("purchases")}</h3>
              {report.purchases.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.vegetableName}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border p-3">
              <h3 className="mb-2 font-semibold">{t("sales")}</h3>
              {report.sales.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.customerName || t("walkInCustomer")}</span>
                  <span>{formatCurrency(item.grandTotal)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border p-3">
              <h3 className="mb-2 font-semibold">{t("expenses")}</h3>
              {report.expenses.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.type}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
