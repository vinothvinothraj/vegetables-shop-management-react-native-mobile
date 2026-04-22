import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/app-context";
import { AppBadge, Card, EmptyState, ImageThumb, ScreenScroll, StatCard, colors } from "@/components/app-ui";
import { formatCurrency } from "@/lib/storage";

export default function StockScreen() {
  const { stockRows, purchases, sales } = useApp();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "remaining-asc" | "remaining-desc">("name-asc");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...stockRows]
      .filter((item) => !term || item.vegetableName.toLowerCase().includes(term) || item.category.toLowerCase().includes(term))
      .sort((left, right) => {
        switch (sortBy) {
          case "name-desc":
            return right.vegetableName.localeCompare(left.vegetableName);
          case "remaining-asc":
            return left.remaining - right.remaining;
          case "remaining-desc":
            return right.remaining - left.remaining;
          default:
            return left.vegetableName.localeCompare(right.vegetableName);
        }
      });
  }, [query, sortBy, stockRows]);

  const totalPurchased = purchases.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalSold = sales.reduce((sum, item) => sum + item.items.reduce((rowSum, saleItem) => rowSum + (saleItem.unit === "g" ? saleItem.qty / 1000 : saleItem.qty), 0), 0);
  const totalRemaining = stockRows.reduce((sum, item) => sum + Number(item.remaining || 0), 0);

  return (
    <ScreenScroll>
      <View style={styles.statGrid}>
        <StatCard label="Purchased" value={`${totalPurchased.toFixed(1)} kg`} accent="success" />
        <StatCard label="Sold" value={`${totalSold.toFixed(1)} kg`} accent="warning" />
        <StatCard label="Remaining" value={`${totalRemaining.toFixed(1)} kg`} accent="primary" />
      </View>

      <Card>
        <Text style={styles.label}>Search</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchValue}>{query || "Type something..."}</Text>
        </View>
        <View style={styles.searchActions}>
          {["carrot", "tomato", "onion", "potato"].map((item) => (
            <Pressable key={item} onPress={() => setQuery(item)} style={styles.quickChip}>
              <Text style={styles.quickChipText}>{item}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setQuery("")} style={styles.quickChip}>
            <Text style={styles.quickChipText}>Clear</Text>
          </Pressable>
        </View>
        <View style={styles.sortRow}>
          {(["name-asc", "name-desc", "remaining-asc", "remaining-desc"] as const).map((item) => (
            <Pressable key={item} onPress={() => setSortBy(item)} style={[styles.sortChip, sortBy === item && styles.sortChipActive]}>
              <Text style={[styles.sortText, sortBy === item && styles.sortTextActive]}>
                {item === "name-asc" ? "Name A-Z" : item === "name-desc" ? "Name Z-A" : item === "remaining-asc" ? "Low remaining" : "High remaining"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="No stock entries found" description="Stock rows are generated automatically from purchases and sales." />
        </Card>
      ) : (
        filtered.map((item) => (
          <Card key={item.productId}>
            <View style={styles.rowTop}>
              <ImageThumb uri={item.image} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.vegetableName}</Text>
                <Text style={styles.meta}>{item.category || item.unit} • {formatCurrency(item.pricePerKg)}</Text>
              </View>
              <AppBadge label={item.remaining <= 5 ? "Low stock" : "Healthy"} tone={item.remaining <= 5 ? "warning" : "success"} />
            </View>
            <View style={styles.metrics}>
              <Metric label="Purchased" value={`${item.purchased.toFixed(1)} kg`} />
              <Metric label="Sold" value={`${item.sold.toFixed(1)} kg`} />
              <Metric label="Remaining" value={`${item.remaining.toFixed(1)} kg`} emphasis />
            </View>
          </Card>
        ))
      )}
    </ScreenScroll>
  );
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={[styles.metric, emphasis && styles.metricEmphasis]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, emphasis && styles.metricValueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
  },
  searchBox: {
    marginTop: 8,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  searchValue: {
    color: colors.muted,
    fontWeight: "700",
  },
  searchActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  sortText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  sortTextActive: {
    color: colors.primary,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 17,
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  metrics: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    backgroundColor: colors.surfaceSoft,
  },
  metricEmphasis: {
    backgroundColor: colors.primarySoft,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    marginTop: 6,
    color: colors.text,
    fontWeight: "800",
  },
  metricValueEmphasis: {
    color: colors.primary,
  },
});
