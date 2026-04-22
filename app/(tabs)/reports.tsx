import { useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/app-context";
import { AppBadge, AppButton, AppInput, Card, EmptyState, ScreenScroll, StatCard, colors } from "@/components/app-ui";
import { ProductPicker } from "@/components/product-picker";
import { formatCurrency } from "@/lib/storage";

type Period = "daily" | "monthly";
type ChartMode = "bar" | "line";

export default function ReportsScreen() {
  const { products, purchases, sales, expenses, reportsForDate, reportsForMonth, demoReportDate } = useApp();
  const [period, setPeriod] = useState<Period>("daily");
  const [date, setDate] = useState(demoReportDate);
  const [productId, setProductId] = useState("");
  const [chartMode, setChartMode] = useState<ChartMode>("bar");

  const report = useMemo(() => {
    return period === "monthly" ? reportsForMonth(date, productId) : reportsForDate(date, productId);
  }, [date, period, productId, reportsForDate, reportsForMonth]);

  const profit = report.salesTotal - report.purchaseTotal - report.expensesTotal;

  const chartData = [
    { label: "Purchases", value: report.purchaseTotal, color: "#0F7A4A" },
    { label: "Sales", value: report.salesTotal, color: "#1F8A4C" },
    { label: "Expenses", value: report.expensesTotal, color: "#C67C00" },
    { label: "Profit", value: profit, color: profit >= 0 ? "#0F7A4A" : "#C0392B" },
  ];

  const trendData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, index) => {
      const dateValue = new Date();
      dateValue.setMonth(dateValue.getMonth() - (5 - index));
      dateValue.setDate(1);
      return {
        key: `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, "0")}`,
        label: dateValue.toLocaleString(undefined, { month: "short" }),
        purchases: 0,
        sales: 0,
        expenses: 0,
      };
    });

    purchases.forEach((item) => {
      const key = item.date.slice(0, 7);
      const target = months.find((entry) => entry.key === key);
      if (target) target.purchases += Number(item.total || 0);
    });

    sales.forEach((item) => {
      const key = item.date.slice(0, 7);
      const target = months.find((entry) => entry.key === key);
      if (target) target.sales += Number(item.grandTotal || 0);
    });

    expenses.forEach((item) => {
      const key = item.date.slice(0, 7);
      const target = months.find((entry) => entry.key === key);
      if (target) target.expenses += Number(item.amount || 0);
    });

    return months.map((entry) => ({
      ...entry,
      profit: entry.sales - entry.purchases - entry.expenses,
    }));
  }, [expenses, purchases, sales]);

  const maxChartValue = Math.max(...chartData.map((item) => Math.max(1, item.value)));
  const maxTrendValue = Math.max(...trendData.map((item) => Math.max(1, item.sales, item.purchases, item.profit)));

  async function exportReport() {
    const lines = [
      `Vegetable shop report`,
      `Period,${period}`,
      `Date,${date}`,
      `Product,${productId || "All products"}`,
      ``,
      `Type,Name,Total`,
      ...report.purchases.map((item) => `Purchase,${item.vegetableName},${item.total}`),
      ...report.sales.map((sale) => sale.items.map((item) => `Sale,${sale.customerName || "Walk-in customer"} - ${item.productName},${item.total}`).join("\n")),
      ...report.expenses.map((item) => `Expense,${item.type},${item.amount}`),
      `Summary purchases,,${report.purchaseTotal}`,
      `Summary sales,,${report.salesTotal}`,
      `Summary expenses,,${report.expensesTotal}`,
      `Summary profit,,${profit}`,
    ].join("\n");

    await Share.share({ message: lines, title: "Vegetable shop report" });
  }

  return (
    <ScreenScroll>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Reports</Text>
          <AppButton title="Share" icon="share-social" onPress={exportReport} compact />
        </View>
        <View style={styles.switchRow}>
          {(["daily", "monthly"] as const).map((item) => (
            <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.switchChip, period === item && styles.switchChipActive]}>
              <Text style={[styles.switchText, period === item && styles.switchTextActive]}>{item === "daily" ? "Daily" : "Monthly"}</Text>
            </Pressable>
          ))}
          {(["bar", "line"] as const).map((item) => (
            <Pressable key={item} onPress={() => setChartMode(item)} style={[styles.switchChip, chartMode === item && styles.switchChipActive]}>
              <Text style={[styles.switchText, chartMode === item && styles.switchTextActive]}>{item === "bar" ? "Bars" : "Trend"}</Text>
            </Pressable>
          ))}
        </View>
        <Field label={period === "monthly" ? "Any date within month" : "Date"}>
          <AppInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label="Product filter">
          <ProductPicker products={products} value={productId} onChange={setProductId} allowAll allLabel="All products" />
        </Field>
      </Card>

      <View style={styles.statGrid}>
        <StatCard label="Purchases" value={formatCurrency(report.purchaseTotal)} hint={`${report.purchases.length} entries`} accent="success" />
        <StatCard label="Sales" value={formatCurrency(report.salesTotal)} hint={`${report.sales.length} bills`} />
        <StatCard label="Expenses" value={formatCurrency(report.expensesTotal)} hint={`${report.expenses.length} entries`} accent="warning" />
        <StatCard label="Profit" value={formatCurrency(profit)} hint="Sales - purchases - expenses" accent={profit >= 0 ? "success" : "danger"} />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Performance snapshot</Text>
        {chartMode === "line" ? (
          <View style={styles.lineChart}>
            {chartData.map((item) => (
              <View key={item.label} style={styles.lineRow}>
                <Text style={styles.lineLabel}>{item.label}</Text>
                <View style={styles.lineTrack}>
                  <View style={[styles.lineFill, { width: `${(item.value / maxChartValue) * 100}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.lineValue}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.barChart}>
            {chartData.map((item) => (
              <View key={item.label} style={styles.barItem}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(12, (item.value / maxChartValue) * 100)}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barValue}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Monthly trend</Text>
        <View style={styles.trendGrid}>
          {trendData.map((item) => (
            <View key={item.key} style={styles.trendItem}>
              <Text style={styles.trendLabel}>{item.label}</Text>
              <View style={styles.trendBars}>
                <TrendBar label="P" value={item.purchases} maxValue={maxTrendValue} color="#0F7A4A" />
                <TrendBar label="S" value={item.sales} maxValue={maxTrendValue} color="#1F8A4C" />
                <TrendBar label="E" value={item.expenses} maxValue={maxTrendValue} color="#C67C00" />
                <TrendBar label="Pr" value={item.profit} maxValue={maxTrendValue} color={item.profit >= 0 ? "#0F7A4A" : "#C0392B"} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Purchases</Text>
        {report.purchases.length === 0 ? (
          <EmptyState title="No purchases in this report" description="Try another date or product filter." />
        ) : (
          report.purchases.map((item) => (
            <Row key={item.id} left={`${item.date} - ${item.vegetableName}`} right={formatCurrency(item.total)} />
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sales</Text>
        {report.sales.length === 0 ? (
          <EmptyState title="No sales in this report" description="Try another date or product filter." />
        ) : (
          report.sales.map((sale) => (
            <View key={sale.id} style={{ gap: 8, marginBottom: 10 }}>
              <Row left={`${sale.date} - ${sale.customerName || "Walk-in customer"}`} right={formatCurrency(sale.grandTotal)} />
              <View style={styles.badgeRow}>
                {sale.items.map((item) => (
                  <AppBadge key={item.id} label={item.productName} />
                ))}
              </View>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Expenses</Text>
        {report.expenses.length === 0 ? (
          <EmptyState title="No expenses in this report" description="Try another date filter." />
        ) : (
          report.expenses.map((item) => <Row key={item.id} left={`${item.date} - ${item.type}`} right={formatCurrency(item.amount)} />)
        )}
      </Card>
    </ScreenScroll>
  );
}

function TrendBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  return (
    <View style={styles.trendBar}>
      <Text style={styles.trendBarLabel}>{label}</Text>
      <View style={styles.trendBarTrack}>
        <View style={[styles.trendBarFill, { height: `${Math.max(8, (value / maxValue) * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Text style={styles.rowRight}>{right}</Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  switchText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  switchTextActive: {
    color: colors.primary,
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: "700",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  barChart: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  barItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    width: "100%",
    height: 160,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "flex-end",
    padding: 8,
  },
  barFill: {
    width: "100%",
    borderRadius: 12,
  },
  barLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  barValue: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
  },
  lineChart: {
    gap: 10,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lineLabel: {
    width: 84,
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  lineTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineFill: {
    height: "100%",
    borderRadius: 999,
  },
  lineValue: {
    width: 100,
    textAlign: "right",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  trendGrid: {
    flexDirection: "row",
    gap: 8,
  },
  trendItem: {
    flex: 1,
    gap: 8,
  },
  trendLabel: {
    textAlign: "center",
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  trendBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    alignItems: "flex-end",
    height: 150,
  },
  trendBar: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  trendBarLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "700",
  },
  trendBarTrack: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    justifyContent: "flex-end",
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendBarFill: {
    width: "100%",
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  rowLeft: {
    flex: 1,
    color: colors.text,
    fontWeight: "600",
  },
  rowRight: {
    color: colors.muted,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
