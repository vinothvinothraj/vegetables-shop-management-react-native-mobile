import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/app-context";
import { AppBadge, AppButton, AppInput, Card, EmptyState, ImageThumb, ScreenScroll, SheetModal, colors } from "@/components/app-ui";
import { categoryOptions, resolveProductImage } from "@/lib/catalog";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/storage";

type ProductForm = Omit<Product, "id">;

const emptyForm: ProductForm = {
  name: "",
  category: "",
  unit: "kg",
  pricePerKg: 0,
  image: "",
  active: true,
};

export default function ProductsScreen() {
  const { products, addProduct, updateProduct, removeProduct } = useApp();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc">("name-asc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...products]
      .filter((item) => {
        if (!term) return true;
        return item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term) || item.unit.toLowerCase().includes(term);
      })
      .sort((left, right) => {
        switch (sortBy) {
          case "name-desc":
            return right.name.localeCompare(left.name);
          case "price-asc":
            return left.pricePerKg - right.pricePerKg;
          case "price-desc":
            return right.pricePerKg - left.pricePerKg;
          default:
            return left.name.localeCompare(right.name);
        }
      });
  }, [products, query, sortBy]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setVisible(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      pricePerKg: product.pricePerKg,
      image: product.image,
      active: product.active,
    });
    setVisible(true);
  }

  async function saveProduct() {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Please enter a product name.");
      return;
    }

    if (Number(form.pricePerKg) <= 0) {
      Alert.alert("Validation", "Price must be greater than zero.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      unit: form.unit.trim() || "kg",
      pricePerKg: Number(form.pricePerKg),
      image: resolveProductImage(form.name.trim(), form.image.trim()),
      active: Boolean(form.active),
    };

    if (editingId) {
      await updateProduct(editingId, payload);
    } else {
      await addProduct(payload);
    }

    setVisible(false);
  }

  function confirmDelete(product: Product) {
    Alert.alert("Delete product", `Remove ${product.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeProduct(product.id);
        },
      },
    ]);
  }

  return (
    <ScreenScroll>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Search</Text>
          <AppButton title="Add" icon="add" onPress={openCreate} compact />
        </View>
        <AppInput value={query} onChangeText={setQuery} placeholder="Name, category, or unit" />
        <View style={styles.sortRow}>
          {(["name-asc", "name-desc", "price-asc", "price-desc"] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setSortBy(item)}
              style={[styles.sortChip, sortBy === item && styles.sortChipActive]}
            >
              <Text style={[styles.sortText, sortBy === item && styles.sortTextActive]}>
                {item === "name-asc" ? "Name A-Z" : item === "name-desc" ? "Name Z-A" : item === "price-asc" ? "Low price" : "High price"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={styles.grid}>
        {filtered.length === 0 ? (
          <Card>
            <EmptyState title="No products found" description="Try another search term or add a new product." />
          </Card>
        ) : (
          filtered.map((product) => (
            <Card key={product.id} style={styles.productCard}>
              <View style={styles.productTop}>
                <ImageThumb uri={resolveProductImage(product.name, product.image)} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>{product.category || "General"} - {product.unit}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(product.pricePerKg)}</Text>
                </View>
                <AppBadge label={product.active ? "Active" : "Inactive"} tone={product.active ? "success" : "warning"} />
              </View>

              <View style={styles.productActions}>
                <AppButton title="Edit" icon="pencil" variant="secondary" compact onPress={() => openEdit(product)} />
                <AppButton title="Delete" icon="trash" variant="danger" compact onPress={() => confirmDelete(product)} />
              </View>
            </Card>
          ))
        )}
      </View>

      <SheetModal
        visible={visible}
        title={editingId ? "Edit Product" : "Add Product"}
        subtitle="Update the catalog details used by the other modules."
        onClose={() => setVisible(false)}
      >
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <Field label="Name">
            <AppInput value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Tomato" />
          </Field>
          <Field label="Category">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {categoryOptions().map((category) => (
                <Chip
                  key={category}
                  label={category}
                  active={form.category === category}
                  onPress={() => setForm((current) => ({ ...current, category }))}
                />
              ))}
            </ScrollView>
          </Field>
          <Field label="Unit">
            <View style={styles.pickerRow}>
              {["kg", "bundle", "piece"].map((unit) => (
                <Chip key={unit} label={unit} active={form.unit === unit} onPress={() => setForm((current) => ({ ...current, unit }))} />
              ))}
            </View>
          </Field>
          <Field label="Price per kg">
            <AppInput
              value={String(form.pricePerKg)}
              onChangeText={(value) => setForm((current) => ({ ...current, pricePerKg: value as unknown as number }))}
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Image URL">
            <AppInput value={form.image} onChangeText={(value) => setForm((current) => ({ ...current, image: value }))} placeholder="https://..." />
          </Field>
          <Field label="Status">
            <View style={styles.pickerRow}>
              <Chip label="Active" active={form.active} onPress={() => setForm((current) => ({ ...current, active: true }))} />
              <Chip label="Inactive" active={!form.active} onPress={() => setForm((current) => ({ ...current, active: false }))} />
            </View>
          </Field>
          <AppButton title={editingId ? "Save changes" : "Create product"} icon="checkmark" onPress={saveProduct} />
        </ScrollView>
      </SheetModal>
    </ScreenScroll>
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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "700",
    color: colors.text,
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
  grid: {
    gap: 12,
  },
  productCard: {
    gap: 12,
  },
  productTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  productName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  productMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  productPrice: {
    marginTop: 6,
    fontWeight: "800",
    color: colors.primary,
  },
  productActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  sheetContent: {
    gap: 14,
    paddingBottom: 20,
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.primary,
  },
});
