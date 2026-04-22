"use client";

import { useMemo, useState } from "react";
import { ImagePlus, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, EmptyState, Input, SectionTitle, Select, TableShell } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Modal } from "@/components/modal";
import { resolveProductImage } from "@/lib/product-catalog";

const emptyForm = {
  name: "",
  category: "",
  unit: "kg",
  pricePerKg: "",
  image: "",
  active: true,
};

const categoryOptions = [
  "General",
  "Local Greens",
  "Root Veg",
  "Allium",
  "Pods",
  "Fresh",
  "Spicy",
  "Leafy Greens",
];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

export default function ProductsPage() {
  const { products, addProduct, updateProduct, removeProduct, formatCurrency, t } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = products.filter((item) => {
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.unit.toLowerCase().includes(term)
      );
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "price-desc":
          return b.pricePerKg - a.pricePerKg;
        case "price-asc":
          return a.pricePerKg - b.pricePerKg;
        default:
          return 0;
      }
    });

    return list;
  }, [products, query, sortBy]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const image = await readFileAsDataUrl(file);
      setForm((current) => ({ ...current, image }));
    } catch {
      toast.error(t("imageUploadFailed"));
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(t("pleaseEnterProductName"));
      return;
    }

    if (Number(form.pricePerKg) <= 0) {
      toast.error(t("priceMustBeGreaterThanZero"));
      return;
    }

    const payload = {
      ...form,
      name: String(form.name || "").trim(),
      category: String(form.category || "").trim(),
      unit: String(form.unit || "kg").trim() || "kg",
      pricePerKg: Number(form.pricePerKg),
      image: resolveProductImage(String(form.name || "").trim(), form.image),
      active: Boolean(form.active),
    };

    if (editingId) {
      updateProduct(editingId, payload);
      toast.success(t("productUpdated"));
    } else {
      addProduct(payload);
      toast.success(t("productAdded"));
    }

    resetForm();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category ?? "",
      unit: item.unit ?? "kg",
      pricePerKg: item.pricePerKg,
      image: item.image || "",
      active: item.active,
    });
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    removeProduct(deleteTarget.id);
    toast.success(t("productDeleted"));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-4">
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{t("productCatalog")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("manageProductsCatalogue")}</p>
          </div>
          <div className="flex gap-2">
            {editingId ? (
              <Button variant="ghost" size="sm" onClick={openCreateForm}>
                {t("clear")}
              </Button>
            ) : null}
            <Button size="sm" onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              <span>{t("addProduct")}</span>
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">{t("search")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchProductNameOrCategory")}
                />
              </div>
            </div>
            <div className="sm:w-44">
              <label className="mb-2 block text-sm font-medium">{t("sort")}</label>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name-asc">{t("nameAZ")}</option>
                <option value="name-desc">{t("nameZA")}</option>
                <option value="price-desc">{t("highestPrice")}</option>
                <option value="price-asc">{t("lowestPrice")}</option>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={t("noData")}
              description={t("productCatalog")}
            />
          ) : (
            <TableShell>
              <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("product")}</th>
                    <th className="px-4 py-3 font-medium">{t("category")}</th>
                    <th className="px-4 py-3 font-medium">{t("price")}</th>
                    <th className="px-4 py-3 font-medium">{t("status")}</th>
                    <th className="px-4 py-3 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveProductImage(item.name, item.image)}
                            alt={item.name}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{item.category || t("general")}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(item.pricePerKg)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.active ? "success" : "warning"}>
                          {item.active ? t("active") : t("inactive")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => startEdit(item)} aria-label={t("editProduct")} title={t("editProduct")}>
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </Card>
      </div>

      <Modal
        open={isFormOpen}
        onClose={resetForm}
        title={editingId ? t("editProduct") : t("addProduct")}
        description={t("manageProductsCatalogue")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              {t("clear")}
            </Button>
            <Button type="submit" form="product-form">
              {editingId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? t("updateProduct") : t("addProduct")}
            </Button>
          </div>
        }
      >
        <form id="product-form" className="space-y-4 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("name")}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tomato" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("category")}</label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="" disabled>
                  {t("category")}
                </option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("unit")}</label>
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="kg">kg</option>
                <option value="bundle">bundle</option>
                <option value="piece">piece</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("price")}</label>
              <Input type="number" min="0" step="0.01" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("image")}</label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                {form.image ? (
                  <img src={form.image} alt={form.name || "product"} className="h-full w-full object-cover" />
                ) : form.name ? (
                  <img src={resolveProductImage(form.name)} alt={form.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-black-forest-400 hover:text-black-forest-700 dark:border-slate-700 dark:text-slate-300">
                <ImagePlus className="h-4 w-4" />
                {t("uploadImage")}
                <input className="hidden" type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t("activeStatus")}</label>
            <Select value={form.active ? "true" : "false"} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
              <option value="true">{t("active")}</option>
              <option value="false">{t("inactive")}</option>
            </Select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`${t("deleteProduct")} ${deleteTarget?.name || t("product")}?`}
        description={t("deleteProductDesc")}
        confirmLabel={t("deleteProduct")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
