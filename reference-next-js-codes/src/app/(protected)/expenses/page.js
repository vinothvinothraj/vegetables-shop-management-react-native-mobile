"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/app-context";
import { Badge, Button, Card, EmptyState, Input, SectionTitle, Select, Textarea, TableShell } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Modal } from "@/components/modal";

const emptyExpense = {
  date: new Date().toISOString().slice(0, 10),
  type: "Transport",
  amount: "",
  note: "",
};

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, removeExpense, formatCurrency, t } = useApp();
  const [form, setForm] = useState(emptyExpense);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const types = [
    t("expenseTypeRent"),
    t("expenseTypeTransport"),
    t("expenseTypeSalary"),
    t("expenseTypeUtilities"),
    t("expenseTypePackaging"),
    t("expenseTypeOther"),
  ];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = expenses.filter((item) => {
      if (!term) return true;
      return (
        item.type.toLowerCase().includes(term) ||
        item.note.toLowerCase().includes(term) ||
        item.date.includes(term)
      );
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return list;
  }, [expenses, query, sortBy]);

  const resetForm = () => {
    setForm(emptyExpense);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.type.trim() || Number(form.amount) <= 0) {
      toast.error(t("selectExpenseTypeAndEnterValidAmount"));
      return;
    }

    const payload = {
      ...form,
      type: String(form.type || "").trim(),
      note: String(form.note || "").trim(),
    };

    if (editingId) {
      updateExpense(editingId, payload);
      toast.success(t("expenseUpdated"));
    } else {
      addExpense(payload);
      toast.success(t("expenseAdded"));
    }

    resetForm();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      date: item.date,
      type: item.type ?? "",
      amount: item.amount,
      note: item.note,
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

    removeExpense(deleteTarget.id);
    setDeleteTarget(null);
    toast.success(t("expenseDeleted"));
  };

  return (
    <div className="space-y-6 pb-20">

      <div className="space-y-4">
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{t("expenses")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("addOperationalExpense")}</p>
          </div>
          <Button size="sm" onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            <span>{t("addExpense")}</span>
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
                  placeholder={t("expenseTypeOther")}
                />
              </div>
            </div>
            <div className="sm:w-44">
              <label className="mb-2 block text-sm font-medium">{t("sort")}</label>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date-desc">{t("newestFirst")}</option>
                <option value="date-asc">{t("oldestFirst")}</option>
                <option value="amount-desc">{t("highestTotal")}</option>
                <option value="amount-asc">{t("lowestTotal")}</option>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title={t("noExpensesYet")} description={t("addOperationalExpense")} />
          ) : (
            <TableShell>
              <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("date")}</th>
                    <th className="px-4 py-3 font-medium">{t("type")}</th>
                    <th className="px-4 py-3 font-medium">{t("amount")}</th>
                    <th className="px-4 py-3 font-medium">{t("note")}</th>
                    <th className="px-4 py-3 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">
                        <Badge variant="warning">{item.type}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-3 max-w-[240px] whitespace-normal break-words">{item.note || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => startEdit(item)}
                            aria-label={t("editExpense")}
                            title={t("editExpense")}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>
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
        title={editingId ? t("editExpense") : t("addExpense")}
        description={t("addOperationalExpense")}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              {t("clear")}
            </Button>
            <Button type="submit" form="expense-form">
              {editingId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? t("editExpense") : t("addExpense")}
            </Button>
          </div>
        }
      >
        <form id="expense-form" className="space-y-4 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("date")}</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("type")}</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("amount")}</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("note")}</label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={t("optional")}
              />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("deleteExpense")}
        description={t("deleteExpenseDesc")}
        confirmLabel={t("deleteExpense")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
