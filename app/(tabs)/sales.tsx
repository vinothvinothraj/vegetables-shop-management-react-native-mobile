import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/app-context";
import {
  AppBadge,
  AppButton,
  AppInput,
  Card,
  EmptyState,
  ImageThumb,
  ScreenScroll,
  SheetModal,
  colors,
} from "@/components/app-ui";
import { formatCurrency } from "@/lib/storage";
import { Product, Sale, SaleItem } from "@/lib/types";

type SaleForm = Omit<Sale, "id" | "grandTotal">;

function createItem(product: Product): SaleItem {
  return {
    id: `${product.id}-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    qty: 1,
    unit: "kg",
    price: product.pricePerKg,
    total: product.pricePerKg,
    image: product.image,
  };
}

function lineTotal(item: SaleItem) {
  const qty = Number(item.qty || 0);
  const price = Number(item.price || 0);
  return item.unit === "g" ? (qty * price) / 1000 : qty * price;
}

function quantityStep(unit: SaleItem["unit"]) {
  return unit === "g" ? 100 : 1;
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function chunkIntoColumns<T>(items: T[], rowsPerColumn: number) {
  const columns: T[][] = [];
  for (let index = 0; index < items.length; index += rowsPerColumn) {
    columns.push(items.slice(index, index + rowsPerColumn));
  }
  return columns;
}

export default function SalesScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 768;
  const tileGap = 10;
  const columnWidth = compact ? 98 : 118;
  const productTileHeight = compact ? 90 : 112;
  const modalColumnWidth = compact ? 94 : 112;
  const modalTileHeight = compact ? 88 : 106;

  const { products, sales, addSale, updateSale, removeSale } = useApp();
  const [productSearch, setProductSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "total-desc" | "total-asc">("date-desc");
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [printVisible, setPrintVisible] = useState(false);
  const [printTargetSale, setPrintTargetSale] = useState<Sale | null>(null);
  const [bill, setBill] = useState<SaleForm>({
    date: new Date().toISOString().slice(0, 10),
    customerName: "",
    items: [],
  });

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products
      .filter((item) => item.active)
      .filter((item) => !term || item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term) || item.unit.toLowerCase().includes(term));
  }, [productSearch, products]);

  const selectedIds = useMemo(() => new Set(bill.items.map((item) => item.productId)), [bill.items]);

  const filteredSales = useMemo(() => {
    const term = billSearch.trim().toLowerCase();
    return [...sales]
      .filter((sale) => {
        if (!term) return true;
        return sale.date.includes(term) || sale.customerName.toLowerCase().includes(term) || sale.items.some((item) => item.productName.toLowerCase().includes(term));
      })
      .sort((left, right) => {
        switch (sortBy) {
          case "date-asc":
            return left.date.localeCompare(right.date);
          case "total-asc":
            return left.grandTotal - right.grandTotal;
          case "total-desc":
            return right.grandTotal - left.grandTotal;
          default:
            return right.date.localeCompare(left.date);
        }
      });
  }, [billSearch, sales, sortBy]);

  const availableProducts = useMemo(() => filteredProducts.filter((product) => !selectedIds.has(product.id)), [filteredProducts, selectedIds]);
  const productColumns = useMemo(() => chunkIntoColumns(filteredProducts, 3), [filteredProducts]);
  const modalColumns = useMemo(() => chunkIntoColumns(availableProducts, 3), [availableProducts]);
  const selectedEntries = useMemo(
    () =>
      bill.items
        .map((item) => ({
          item,
          product: products.find((entry) => entry.id === item.productId),
        }))
        .filter(({ item, product }) => item && (product || item.productId)),
    [bill.items, products]
  );

  const subtotal = useMemo(() => bill.items.reduce((sum, item) => sum + lineTotal(item), 0), [bill.items]);
  const selectedCount = bill.items.length;

  function toggleProduct(product: Product) {
    setBill((current) => {
      const exists = current.items.some((item) => item.productId === product.id);
      if (exists) {
        return { ...current, items: current.items.filter((item) => item.productId !== product.id) };
      }

      return { ...current, items: [createItem(product), ...current.items] };
    });
  }

  function updateItem(itemId: string, field: keyof SaleItem, value: string | number) {
    setBill((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
              total: field === "qty" || field === "price" || field === "unit" ? lineTotal({ ...item, [field]: value } as SaleItem) : item.total,
            }
          : item
      ),
    }));
  }

  function addQuantity(itemId: string, delta: number) {
    setBill((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const step = quantityStep(item.unit);
        const nextQty = Math.max(step, Number(item.qty || 0) + delta * step);
        return {
          ...item,
          qty: nextQty,
          total: lineTotal({ ...item, qty: nextQty }),
        };
      }),
    }));
  }

  function toggleItemUnit(itemId: string) {
    setBill((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const nextUnit = item.unit === "g" ? "kg" : "g";
        const nextQty = nextUnit === "g" ? Number(item.qty || 0) * 1000 : Number(item.qty || 0) / 1000;

        return {
          ...item,
          unit: nextUnit,
          qty: Number(nextQty.toFixed(3)),
          total: lineTotal({
            ...item,
            unit: nextUnit,
            qty: Number(nextQty.toFixed(3)),
          }),
        };
      }),
    }));
  }

  function removeItem(itemId: string) {
    setBill((current) => ({ ...current, items: current.items.filter((item) => item.id !== itemId) }));
  }

  function editSale(sale: Sale) {
    setEditingSaleId(sale.id);
    setBill({
      date: sale.date,
      customerName: sale.customerName,
      items: sale.items.map((item) => ({ ...item, total: lineTotal(item) })),
    });
    setCartVisible(true);
  }

  function handlePrintSale(sale: Sale) {
    setPrintTargetSale(sale);
    setPrintVisible(true);
  }

  function clearBill() {
    setBill({
      date: new Date().toISOString().slice(0, 10),
      customerName: "",
      items: [],
    });
    setEditingSaleId(null);
  }

  async function saveBill() {
    if (bill.items.length === 0) {
      Alert.alert("Validation", "Select at least one product.");
      return;
    }

    if (bill.items.some((item) => Number(item.qty || 0) <= 0 || Number(item.price || 0) <= 0)) {
      Alert.alert("Validation", "Every line item needs a valid quantity and price.");
      return;
    }

    const payload: SaleForm = {
      date: bill.date,
      customerName: bill.customerName.trim(),
      items: bill.items.map((item) => ({ ...item, total: lineTotal(item) })),
    };

    if (editingSaleId) {
      await updateSale(editingSaleId, payload);
    } else {
      await addSale(payload);
    }

    clearBill();
    setCartVisible(false);
  }

  function confirmDelete(sale: Sale) {
    Alert.alert("Delete bill", `Remove the sale for ${sale.date}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => await removeSale(sale.id) },
    ]);
  }

  return (
    <ScreenScroll>
      <Card style={styles.sectionCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Product Grid</Text>
            <Text style={styles.sectionHint}>Tap product cards to add them to the bill.</Text>
          </View>
          <AppButton title={`Cart ${selectedCount}`} icon="cart-outline" onPress={() => setCartVisible(true)} compact />
        </View>

        <AppInput value={productSearch} onChangeText={setProductSearch} placeholder="Search product name or category" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalGridContent}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyGridWrap}>
              <EmptyState title="No products found" description="Try another search term." />
            </View>
          ) : (
            <View style={styles.columnRow}>
              {productColumns.map((column, columnIndex) => (
                <View key={`column-${columnIndex}`} style={[styles.productColumn, { width: columnWidth, gap: tileGap }]}>
                  {column.map((product) => {
                    const selected = bill.items.some((item) => item.productId === product.id);
                    return (
                      <Pressable
                        key={product.id}
                        onPress={() => toggleProduct(product)}
                        style={[
                          styles.productTile,
                          { height: productTileHeight },
                          selected && styles.productTileSelected,
                        ]}
                      >
                        <View style={styles.productImageWrap}>
                          <ImageThumb uri={product.image} size={compact ? 60 : 72} />
                          {selected ? (
                            <View style={styles.selectedCheck}>
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.searchHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Saved Bills</Text>
            <Text style={styles.sectionHint}>Search by customer, product, or date.</Text>
          </View>
        </View>

        <AppInput value={billSearch} onChangeText={setBillSearch} placeholder="Customer, product, or date" />

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

      {filteredSales.length === 0 ? (
        <Card>
          <EmptyState title="No bills found" description="Create and save the first bill." />
        </Card>
      ) : (
        filteredSales.map((sale) => (
          <Card key={sale.id} style={styles.saleCard}>
            <Pressable onPress={() => editSale(sale)} style={styles.salePressable}>
              <View style={styles.saleTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.saleTitle}>{sale.customerName || "Walk-in customer"}</Text>
                  <Text style={styles.saleMeta}>
                    {sale.date} · {sale.items.length} items
                  </Text>
                </View>
                <AppBadge label={formatCurrency(sale.grandTotal)} tone="success" />
              </View>

              <View style={styles.badgeRow}>
                {sale.items.map((item) => (
                  <AppBadge key={item.id} label={item.productName} />
                ))}
              </View>
            </Pressable>

            <View style={styles.actions}>
              <AppButton title="Edit" icon="pencil" variant="secondary" compact onPress={() => editSale(sale)} />
                <AppButton title="Print" icon="print-outline" variant="secondary" compact onPress={() => handlePrintSale(sale)} style={styles.printButton} />
              <AppButton title="Delete" icon="trash" variant="danger" compact onPress={() => confirmDelete(sale)} />
            </View>
          </Card>
        ))
      )}

      <SheetModal visible={cartVisible} title="Cart" subtitle="Edit quantities, price, and save the bill." onClose={() => setCartVisible(false)}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetTopRow}>
            <Text style={styles.sheetCount}>{selectedCount} items</Text>
            <AppButton title="Clear" icon="trash" variant="secondary" compact onPress={clearBill} />
          </View>

          <Card style={styles.drawerCard}>
            <View style={styles.drawerCardHeader}>
              <View>
                <Text style={styles.cardHeading}>All Products</Text>
                <Text style={styles.sectionHint}>Tap any card to add it to the bill.</Text>
              </View>
              <AppBadge label={String(availableProducts.length)} tone="success" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalGridContent}>
              {availableProducts.length === 0 ? (
                <View style={styles.emptyGridWrap}>
                  <EmptyState title="All good" description="All visible products are already selected." />
                </View>
              ) : (
                <View style={styles.columnRow}>
                  {modalColumns.map((column, columnIndex) => (
                    <View key={`modal-column-${columnIndex}`} style={[styles.productColumn, { width: modalColumnWidth, gap: tileGap }]}>
                      {column.map((product) => (
                        <Pressable
                          key={product.id}
                          onPress={() => toggleProduct(product)}
                          style={[styles.modalTile, { height: modalTileHeight }]}
                        >
                          <View style={styles.productImageWrap}>
                            <ImageThumb uri={product.image} size={compact ? 58 : 68} />
                          </View>
                          <Text style={styles.modalTileLabel} numberOfLines={1}>
                            {product.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Card>

          <View style={styles.modalColumns}>
            <Card style={styles.drawerCard}>
              <View style={styles.drawerCardHeader}>
                <View>
                  <Text style={styles.cardHeading}>Selected</Text>
                  <Text style={styles.sectionHint}>Adjust quantity, price, or unit.</Text>
                </View>
                <AppBadge label={String(selectedEntries.length)} tone="success" />
              </View>

              <View style={styles.selectedList}>
                {selectedEntries.length === 0 ? (
                  <EmptyState title="No items in cart" description="Tap a product card above to add it to the bill." />
                ) : (
                  selectedEntries.map(({ item, product }) => (
                    <View key={item.id} style={styles.selectedCard}>
                      <View style={styles.selectedTop}>
                        <View style={styles.selectedProduct}>
                          <ImageThumb uri={item.image || product?.image} size={50} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.selectedTitle} numberOfLines={1}>
                              {item.productName}
                            </Text>
                            <Text style={styles.selectedMeta} numberOfLines={1}>
                              {product?.category || "General"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.selectedActions}>
                          <Pressable
                            onPress={() => toggleItemUnit(item.id)}
                            style={[styles.unitButton, item.unit === "g" && styles.unitButtonActive]}
                          >
                            <Text style={[styles.unitButtonText, item.unit === "g" && styles.unitButtonTextActive]}>
                              {item.unit}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => removeItem(item.id)} style={styles.closeButton} accessibilityLabel="Remove item">
                            <Ionicons name="close" size={18} color={colors.danger} />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.quantityRow}>
                        <View style={styles.quantityField}>
                          <Text style={styles.fieldLabel}>Qty</Text>
                          <View style={styles.stepper}>
                            <Pressable onPress={() => addQuantity(item.id, -1)} style={styles.stepperButton}>
                              <Ionicons name="remove" size={16} color={colors.text} />
                            </Pressable>
                            <AppInput
                              value={formatQuantity(Number(item.qty || 0))}
                              onChangeText={(value) => updateItem(item.id, "qty", Number(value) || 0)}
                              keyboardType="decimal-pad"
                              style={styles.stepperInput}
                            />
                            <Pressable onPress={() => addQuantity(item.id, 1)} style={styles.stepperButton}>
                              <Ionicons name="add" size={16} color={colors.text} />
                            </Pressable>
                          </View>
                        </View>

                        <View style={styles.quantityField}>
                          <Text style={styles.fieldLabel}>Price (LKR)</Text>
                          <AppInput
                            value={formatQuantity(Number(item.price || 0))}
                            onChangeText={(value) => updateItem(item.id, "price", Number(value) || 0)}
                            keyboardType="decimal-pad"
                            style={styles.rightInput}
                          />
                        </View>

                        <View style={styles.quantityField}>
                          <Text style={styles.fieldLabel}>Total (LKR)</Text>
                          <AppInput value={formatQuantity(lineTotal(item))} editable={false} style={styles.rightInput} />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </Card>

            <Card style={styles.drawerCard}>
              <View style={styles.drawerCardHeader}>
                <View>
                  <Text style={styles.cardHeading}>Receipt</Text>
                  <Text style={styles.sectionHint}>Preview the bill before saving it.</Text>
                </View>
                <AppButton title="Print" icon="print-outline" variant="secondary" compact onPress={() => Alert.alert("Print", "Printing is not enabled in the mobile build yet.")} />
              </View>

              <View style={styles.receiptFields}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <AppInput value={bill.date} onChangeText={(value) => setBill((current) => ({ ...current, date: value }))} />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Customer</Text>
                  <AppInput
                    value={bill.customerName}
                    onChangeText={(value) => setBill((current) => ({ ...current, customerName: value }))}
                    placeholder="Optional"
                  />
                </View>
              </View>

              <View style={styles.receiptPreview}>
                {bill.items.length === 0 ? (
                  <Text style={styles.receiptEmpty}>Select products to preview the receipt.</Text>
                ) : (
                  bill.items.map((item) => (
                    <View key={item.id} style={styles.receiptRow}>
                      <Text style={styles.receiptLabel} numberOfLines={1}>
                        {item.productName} x {formatQuantity(Number(item.qty || 0))} {item.unit}
                      </Text>
                      <Text style={styles.receiptValue}>{formatCurrency(lineTotal(item))}</Text>
                    </View>
                  ))
                )}

                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Grand total</Text>
                  <Text style={styles.receiptTotalValue}>{formatCurrency(subtotal)}</Text>
                </View>
              </View>

              <View style={styles.footerActions}>
                <AppButton title={editingSaleId ? "Save Bill" : "Generate Bill"} icon="checkmark" onPress={saveBill} fullWidth />
                <AppButton
                  title="Reset"
                  icon="refresh"
                  variant="secondary"
                  fullWidth
                  onPress={() => {
                    clearBill();
                  }}
                />
              </View>
            </Card>
          </View>
        </ScrollView>
      </SheetModal>

      <SheetModal
        visible={printVisible && Boolean(printTargetSale)}
        title="Print Preview"
        subtitle="Review the saved bill without opening the cart."
        onClose={() => {
          setPrintVisible(false);
          setPrintTargetSale(null);
        }}
      >
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {printTargetSale ? (
            <>
              <View style={styles.receiptPreview}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date</Text>
                  <Text style={styles.receiptValue}>{printTargetSale.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Customer</Text>
                  <Text style={styles.receiptValue}>{printTargetSale.customerName || "Walk-in customer"}</Text>
                </View>

                {printTargetSale.items.map((item) => (
                  <View key={`print-${item.id}`} style={styles.receiptRow}>
                    <Text style={styles.receiptLabel} numberOfLines={1}>
                      {item.productName} x {formatQuantity(Number(item.qty || 0))} {item.unit}
                    </Text>
                    <Text style={styles.receiptValue}>{formatCurrency(lineTotal(item))}</Text>
                  </View>
                ))}

                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Grand total</Text>
                  <Text style={styles.receiptTotalValue}>{formatCurrency(printTargetSale.grandTotal)}</Text>
                </View>
              </View>

              <View style={styles.footerActions}>
                <AppButton
                  title="Print"
                  icon="print-outline"
                  style={styles.printButton}
                  fullWidth
                  onPress={() => {
                    Alert.alert("Print", "Native printing is not connected yet.");
                  }}
                />
                <AppButton
                  title="Close"
                  icon="close"
                  variant="secondary"
                  fullWidth
                  onPress={() => {
                    setPrintVisible(false);
                    setPrintTargetSale(null);
                  }}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      </SheetModal>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  searchHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyGridWrap: {
    width: "100%",
  },
  horizontalGridContent: {
    gap: 10,
    paddingVertical: 2,
  },
  columnRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 6,
  },
  productColumn: {
    gap: 10,
  },
  productTile: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  productTileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  productImageWrap: {
    position: "relative",
  },
  selectedCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  productName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    width: "100%",
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
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
  saleCard: {
    gap: 12,
  },
  salePressable: {
    gap: 10,
  },
  saleTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saleTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  saleMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  printButton: {
    backgroundColor: "#D9F0FF",
    borderColor: "#A7D8FF",
  },
  sheetContent: {
    gap: 14,
    paddingBottom: 24,
  },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetCount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  drawerCard: {
    gap: 12,
  },
  drawerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeading: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  modalTile: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  modalTileLabel: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
    color: colors.text,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    width: "100%",
  },
  modalColumns: {
    gap: 14,
  },
  selectedList: {
    gap: 12,
  },
  selectedCard: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
  },
  selectedTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  selectedProduct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  selectedTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  selectedMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  selectedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unitButton: {
    minHeight: 36,
    minWidth: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
  },
  unitButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  unitButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  unitButtonTextActive: {
    color: colors.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDE8E5",
  },
  quantityRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  quantityField: {
    flex: 1,
    minWidth: 108,
    gap: 6,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    overflow: "hidden",
  },
  stepperButton: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  stepperInput: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    textAlign: "center",
    minHeight: 42,
    paddingHorizontal: 4,
  },
  rightInput: {
    textAlign: "right",
    paddingRight: 10,
    paddingLeft: 12,
  },
  receiptFields: {
    gap: 10,
  },
  formField: {
    gap: 6,
  },
  receiptPreview: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surfaceSoft,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  receiptLabel: {
    flex: 1,
    color: colors.text,
    fontWeight: "700",
  },
  receiptValue: {
    color: colors.muted,
    fontWeight: "800",
  },
  receiptEmpty: {
    color: colors.muted,
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  receiptTotalLabel: {
    color: colors.text,
    fontWeight: "900",
  },
  receiptTotalValue: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 18,
  },
  footerActions: {
    gap: 10,
  },
});


