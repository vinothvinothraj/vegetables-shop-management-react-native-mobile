import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/app-context";
import { AppBadge, Card, EmptyState, ImageThumb, ScreenScroll, StatCard, colors } from "@/components/app-ui";
import { formatCurrency } from "@/lib/storage";

export default function DashboardScreen() {
  const router = useRouter();
  const { totals, purchases, sales, expenses } = useApp();

  const recentActivity = useMemo(() => {
    const merged = [
      ...purchases.map((item) => ({ date: item.date, title: `Purchase - ${item.vegetableName}`, value: item.total })),
      ...sales.map((item) => ({ date: item.date, title: `Sale - ${item.customerName || "Walk-in customer"}`, value: item.grandTotal })),
      ...expenses.map((item) => ({ date: item.date, title: `Expense - ${item.type}`, value: item.amount })),
    ];

    return merged.sort((left, right) => right.date.localeCompare(left.date)).slice(0, 6);
  }, [expenses, purchases, sales]);

  return (
    <ScreenScroll>
      <View style={styles.statGrid}>
        <StatCard label="Products" value={`${totals.totalProducts}`} hint="Active catalog" />
        <StatCard label="Purchases" value={formatCurrency(totals.totalPurchases)} hint="All time" accent="success" />
        <StatCard label="Sales" value={formatCurrency(totals.totalSales)} hint="All time" />
        <StatCard label="Profit" value={formatCurrency(totals.profit)} hint="Sales - purchases - expenses" accent={totals.profit >= 0 ? "success" : "danger"} />
      </View>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionGrid}>
          <ActionButton icon="leaf-outline" label="Products" onPress={() => router.push("/products")} />
          <ActionButton icon="download-outline" label="Purchases" onPress={() => router.push("/purchases")} />
          <ActionButton icon="pricetag-outline" label="Sales" onPress={() => router.push("/sales")} />
          <ActionButton icon="wallet-outline" label="Expenses" onPress={() => router.push("/expenses")} />
          <ActionButton icon="layers-outline" label="Stock" onPress={() => router.push("/stock")} />
          <ActionButton icon="bar-chart-outline" label="Reports" onPress={() => router.push("/reports")} />
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Low Stock</Text>
          <AppBadge label={`${totals.lowStock.length} items`} tone={totals.lowStock.length > 0 ? "warning" : "success"} />
        </View>
        {totals.lowStock.length === 0 ? (
          <EmptyState title="Stock looks healthy" description="All tracked products are above the warning threshold." />
        ) : (
          <View style={styles.list}>
            {totals.lowStock.slice(0, 5).map((item) => (
              <View key={item.productId} style={styles.listRow}>
                <ImageThumb uri={item.image} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.vegetableName}</Text>
                  <Text style={styles.listMeta}>{item.category || item.unit}</Text>
                </View>
                <Text style={styles.lowStockValue}>{item.remaining.toFixed(1)} kg</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {recentActivity.length === 0 ? (
          <EmptyState title="No activity yet" description="Create purchases, sales, or expenses to see the timeline." />
        ) : (
          <View style={styles.list}>
            {recentActivity.map((item, index) => (
              <View key={`${item.date}-${item.title}-${index}`} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listMeta}>{item.date}</Text>
                </View>
                <Text style={styles.timelineValue}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScreenScroll>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    width: "31%",
    minWidth: 96,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  list: {
    gap: 10,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  listMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  lowStockValue: {
    color: colors.danger,
    fontWeight: "800",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  timelineValue: {
    color: colors.text,
    fontWeight: "800",
  },
});
