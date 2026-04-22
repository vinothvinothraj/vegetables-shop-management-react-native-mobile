import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/app-context";
import { AppBadge, AppButton, AppInput, Card, EmptyState, ImageThumb, ScreenScroll, SheetModal, colors } from "@/components/app-ui";
import { ProductPicker } from "@/components/product-picker";
import { formatCurrency } from "@/lib/storage";
import { Purchase } from "@/lib/types";

type PurchaseForm = Omit<Purchase, "id" | "total" | "vegetableName"> & { vegetableName: string };

const emptyForm: PurchaseForm = {
  date: new Date().toISOString().slice(0, 10),
  supplierName: "",
  productId: "",
  vegetableName: "",
  quantity: 0,
  pricePerKg: 0,
};

export default function PurchasesScreen() {
  const { products, purchases, addPurchase, updatePurchase, removePurchase } = useApp();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "total-desc" | "total-asc">("date-desc");
  const [productFilter, setProductFilter] = useState("");
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PurchaseForm>(emptyForm);

  const selectedProduct = useMemo(() => products.find((item) => item.id === form.productId), [form.productId, products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...purchases]
      .filter((item) => {
        if (productFilter && item.productId !== productFilter) return false;
        if (!term) return true;
        return item.supplierName.toLowerCase().includes(term) || item.vegetableName.toLowerCase().includes(term) || item.date.includes(term);
      })
      .sort((left, right) => {
        switch (sortBy) {
          case "date-asc":
            return left.date.localeCompare(right.date);
          case "total-asc":
            return left.total - right.total;
          case "total-desc":
            return right.total - left.total;
          default:
            return right.date.localeCompare(left.date);
        }
      });
  }, [purchases, query, sortBy, productFilter]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setVisible(true);
  }

  function openEdit(item: Purchase) {
    setEditingId(item.id);
    setForm({
      date: item.date,
      supplierName: item.supplierName,
      productId: item.productId || "",
      vegetableName: item.vegetableName,
      quantity: item.quantity,
      pricePerKg: item.pricePerKg,
    });
    setVisible(true);
  }

  async function savePurchase() {
    if (!form.supplierName.trim() || !form.productId) {
      Alert.alert("Validation", "Select a product and enter the supplier name.");
      return;
    }

    if (Number(form.quantity) <= 0 || Number(form.pricePerKg) <= 0) {
      Alert.alert("Validation", "Quantity and price must be greater than zero.");
      return;
    }

    const product = products.find((item) => item.id === form.productId);
    const payload = {
      ...form,
      supplierName: form.supplierName.trim(),
      vegetableName: product?.name || form.vegetableName.trim(),
      quantity: Number(form.quantity),
      pricePerKg: Number(form.pricePerKg),
    };

    if (editingId) {
      await updatePurchase(editingId, payload);
    } else {
      await addPurchase(payload);
    }

    setVisible(false);
  }

  function confirmDelete(item: Purchase) {
    Alert.alert("Delete purchase", `Remove the purchase for ${item.vegetableName}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => await removePurchase(item.id) },
    ]);
  }

  return (
    <ScreenScroll>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Search</Text>
          <AppButton title="Add" icon="add" onPress={openCreate} compact />
        </View>
        <AppInput value={query} onChangeText={setQuery} placeholder="Supplier, product, or date" />
        <Text style={[styles.label, { marginTop: 8 }]}>Filter by product</Text>
        <ProductPicker products={products} value={productFilter} onChange={setProductFilter} allowAll allLabel="All products" />
        <View style={styles.sortRow}>
          {(["date-desc", "date-asc", "total-desc", "total-asc"] as const).map((item) => (
            <Pressable key={item} onPress={() => setSortBy(item)} style={[styles.sortChip, sortBy === item && styles.sortChipActive]}>
              <Text style={[styles.sortText, sortBy === item && styles.sortTextActive]}>
                {item === "date-desc" ? "Newest" : item === "date-asc" ? "Oldest" : item === "total-desc" ? "High total" : "Low total"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="No purchases yet" description="Use Add to create the first purchase record." />
        </Card>
      ) : (
        filtered.map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          return (
            <Card key={item.id}>
              <View style={styles.rowTop}>
                <ImageThumb uri={product?.image} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.vegetableName}</Text>
                  <Text style={styles.meta}>{item.supplierName} - {item.date}</Text>
                </View>
                <AppBadge label={formatCurrency(item.total)} tone="success" />
              </View>
              <View style={styles.metrics}>
                <Metric label="Qty" value={`${item.quantity} ${product?.unit || "kg"}`} />
                <Metric label="Price" value={formatCurrency(item.pricePerKg)} />
              </View>
              <View style={styles.actions}>
                <AppButton title="Edit" icon="pencil" variant="secondary" compact onPress={() => openEdit(item)} />
                <AppButton title="Delete" icon="trash" variant="danger" compact onPress={() => confirmDelete(item)} />
              </View>
            </Card>
          );
        })
      )}

      <SheetModal visible={visible} title={editingId ? "Edit Purchase" : "Add Purchase"} subtitle="Track what you bought from suppliers." onClose={() => setVisible(false)}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <Field label="Date">
            <AppInput value={form.date} onChangeText={(value) => setForm((current) => ({ ...current, date: value }))} placeholder="YYYY-MM-DD" />
          </Field>
          <Field label="Supplier">
            <AppInput value={form.supplierName} onChangeText={(value) => setForm((current) => ({ ...current, supplierName: value }))} placeholder="Supplier name" />
          </Field>
          <Field label="Product">
            <ProductPicker
              products={products}
              value={form.productId || ""}
              onChange={(productId) => {
                const product = products.find((item) => item.id === productId);
                setForm((current) => ({
                  ...current,
                  productId,
                  vegetableName: product?.name || "",
                  pricePerKg: product?.pricePerKg || 0,
                }));
              }}
            />
          </Field>
          <Field label={`Quantity (${selectedProduct?.unit || "kg"})`}>
            <AppInput value={String(form.quantity)} onChangeText={(value) => setForm((current) => ({ ...current, quantity: Number(value) || 0 }))} keyboardType="decimal-pad" />
          </Field>
          <Field label="Price per kg">
            <AppInput value={String(form.pricePerKg)} onChangeText={(value) => setForm((current) => ({ ...current, pricePerKg: Number(value) || 0 }))} keyboardType="decimal-pad" />
          </Field>
          <Field label="Total">
            <View style={styles.totalBox}>
              <Text style={styles.totalText}>{formatCurrency(Number(form.quantity || 0) * Number(form.pricePerKg || 0))}</Text>
            </View>
          </Field>
          <AppButton title={editingId ? "Save changes" : "Create purchase"} icon="checkmark" onPress={savePurchase} />
        </ScrollView>
      </SheetModal>
    </ScreenScroll>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontWeight: "700",
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
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
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  sheetContent: {
    gap: 14,
    paddingBottom: 20,
  },
  totalBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    minHeight: 46,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  totalText: {
    color: colors.primary,
    fontWeight: "800",
  },
});
