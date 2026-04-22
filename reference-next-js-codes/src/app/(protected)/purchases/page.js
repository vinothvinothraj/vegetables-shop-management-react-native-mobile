"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, EmptyState, Input, SectionTitle, Select, TableShell } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Modal } from "@/components/modal";
import { ProductPicker } from "@/components/product-picker";
import { resolveProductImage } from "@/lib/product-catalog";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  supplierName: "",
  productId: "",
  vegetableName: "",
  quantity: "",
  pricePerKg: "",
};

export default function PurchasesPage() {
  const { products, purchases, addPurchase, updatePurchase, removePurchase, formatCurrency, t } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [productFilter, setProductFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let list = purchases.filter((item) => {
      if (!search) return true;
      return (
        item.supplierName.toLowerCase().includes(search) ||
        item.vegetableName.toLowerCase().includes(search) ||
        item.date.includes(search)
      );
    });

    if (productFilter) {
      list = list.filter((item) => item.productId === productFilter);
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "total-asc":
          return a.total - b.total;
        case "total-desc":
          return b.total - a.total;
        default:
          return 0;
      }
    });

    return list;
  }, [purchases, query, sortBy, productFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleProductChange = (productId) => {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({
      ...current,
      productId,
      vegetableName: product?.name || "",
      pricePerKg: product?.pricePerKg || "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.productId || !form.supplierName.trim()) {
      toast.error(t("pleaseSelectProductAndEnterSupplierName"));
      return;
    }

    if (Number(form.quantity) <= 0 || Number(form.pricePerKg) <= 0) {
      toast.error(t("quantityAndPriceMustBeGreaterThanZero"));
      return;
    }

    const product = products.find((item) => item.id === form.productId);
    const payload = {
      ...form,
      supplierName: form.supplierName.trim(),
      vegetableName: product?.name || form.vegetableName.trim(),
    };

    if (editingId) {
      updatePurchase(editingId, payload);
      toast.success(t("purchaseUpdated"));
    } else {
      addPurchase(payload);
      toast.success(t("purchaseAdded"));
    }

    resetForm();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      date: item.date,
      supplierName: item.supplierName,
      productId: item.productId || "",
      vegetableName: item.vegetableName,
      quantity: item.quantity,
      pricePerKg: item.pricePerKg,
    });
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    removePurchase(deleteTarget.id);
    setDeleteTarget(null);
    toast.success(t("purchaseDeleted"));
  };

  const selectedProduct = products.find((item) => item.id === form.productId);

  return (
    <div className="space-y-6 pb-20">

      <div className="space-y-4">
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{t("purchases")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("trackPurchasesBillingExpensesStockAndProfit")}</p>
          </div>
          <Button size="sm" onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            <span>{t("addPurchase")}</span>
          </Button>
        </Card>

        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">{t("search")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchSupplierOrProduct")}
                />
              </div>
            </div>
            <div className="sm:w-56">
              <label className="mb-2 block text-sm font-medium">{t("productFilter")}</label>
              <ProductPicker
                products={products}
                value={productFilter}
                onChange={setProductFilter}
                allowAll
                placeholder={t("allProducts")}
                allLabel={t("allProducts")}
              />
            </div>
            <div className="sm:w-44">
              <label className="mb-2 block text-sm font-medium">{t("sort")}</label>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date-desc">{t("newestFirst")}</option>
                <option value="date-asc">{t("oldestFirst")}</option>
                <option value="total-desc">{t("highestTotal")}</option>
                <option value="total-asc">{t("lowestTotal")}</option>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title={t("noPurchasesYet")} description={t("createFirstPurchase")} />
          ) : (
            <TableShell>
              <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("date")}</th>
                    <th className="px-4 py-3 font-medium">{t("supplier")}</th>
                    <th className="px-4 py-3 font-medium">{t("product")}</th>
                    <th className="px-4 py-3 font-medium">{t("quantity")}</th>
                    <th className="px-4 py-3 font-medium">{t("price")}</th>
                    <th className="px-4 py-3 font-medium">{t("total")}</th>
                    <th className="px-4 py-3 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const product = products.find((entry) => entry.id === item.productId);
                    return (
                      <tr key={item.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                        <td className="px-4 py-3">{item.date}</td>
                        <td className="px-4 py-3">{item.supplierName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                          <img
                              src={resolveProductImage(item.vegetableName, product?.image)}
                              alt={item.vegetableName}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                            <Badge>{item.vegetableName}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.quantity} {product?.unit || "kg"}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(item.pricePerKg)}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(item.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => startEdit(item)} aria-label={t("editPurchase")} title={t("editPurchase")}>
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableShell>
          )}
        </Card>
      </div>

      <Modal
        open={isFormOpen}
        onClose={resetForm}
        title={editingId ? t("editPurchase") : t("addPurchase")}
        description={t("trackPurchasesBillingExpensesStockAndProfit")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              {t("clear")}
            </Button>
            <Button type="submit" form="purchase-form">
              {editingId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? t("editPurchase") : t("addPurchase")}
            </Button>
          </div>
        }
      >
        <form id="purchase-form" className="grid gap-4 p-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("date")}</label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("supplier")}</label>
            <Input
              value={form.supplierName}
              onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              placeholder={t("supplierName")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">{t("product")}</label>
            <ProductPicker products={products} value={form.productId} onChange={handleProductChange} allowAll placeholder={t("allProducts")} allLabel={t("allProducts")} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("quantity")} ({selectedProduct?.unit || "kg"})
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("price")}</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerKg}
              onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("total")}</label>
            <Input value={formatCurrency(Number(form.quantity || 0) * Number(form.pricePerKg || 0))} readOnly />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("deletePurchase")}
        description={t("deletePurchaseDesc")}
        confirmLabel={t("deletePurchase")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
