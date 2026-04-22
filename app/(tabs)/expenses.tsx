import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/app-context";
import { AppBadge, AppButton, AppInput, Card, EmptyState, ScreenScroll, SheetModal, colors } from "@/components/app-ui";
import { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/storage";

type ExpenseForm = Omit<Expense, "id">;

const types = ["Rent", "Transport", "Salary", "Utilities", "Packaging", "Other"];

const emptyForm: ExpenseForm = {
  date: new Date().toISOString().slice(0, 10),
  type: "Transport",
  amount: 0,
  note: "",
};

export default function ExpensesScreen() {
  const { expenses, addExpense, updateExpense, removeExpense } = useApp();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...expenses]
      .filter((item) => {
        if (!term) return true;
        return item.type.toLowerCase().includes(term) || item.note.toLowerCase().includes(term) || item.date.includes(term);
      })
      .sort((left, right) => {
        switch (sortBy) {
          case "date-asc":
            return left.date.localeCompare(right.date);
          case "amount-asc":
            return left.amount - right.amount;
          case "amount-desc":
            return right.amount - left.amount;
          default:
            return right.date.localeCompare(left.date);
        }
      });
  }, [expenses, query, sortBy]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setVisible(true);
  }

  function openEdit(item: Expense) {
    setEditingId(item.id);
    setForm({
      date: item.date,
      type: item.type,
      amount: item.amount,
      note: item.note,
    });
    setVisible(true);
  }

  async function saveExpense() {
    if (!form.type.trim() || Number(form.amount) <= 0) {
      Alert.alert("Validation", "Select a type and enter a valid amount.");
      return;
    }

    const payload = {
      ...form,
      type: form.type.trim(),
      note: form.note.trim(),
      amount: Number(form.amount),
    };

    if (editingId) {
      await updateExpense(editingId, payload);
    } else {
      await addExpense(payload);
    }

    setVisible(false);
  }

  function confirmDelete(item: Expense) {
    Alert.alert("Delete expense", `Remove ${item.type}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => await removeExpense(item.id) },
    ]);
  }

  return (
    <ScreenScroll>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Search</Text>
          <AppButton title="Add" icon="add" onPress={openCreate} compact />
        </View>
        <AppInput value={query} onChangeText={setQuery} placeholder="Type, note, or date" />
        <View style={styles.sortRow}>
          {(["date-desc", "date-asc", "amount-desc", "amount-asc"] as const).map((item) => (
            <Pressable key={item} onPress={() => setSortBy(item)} style={[styles.sortChip, sortBy === item && styles.sortChipActive]}>
              <Text style={[styles.sortText, sortBy === item && styles.sortTextActive]}>
                {item === "date-desc" ? "Newest" : item === "date-asc" ? "Oldest" : item === "amount-desc" ? "High amount" : "Low amount"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="No expenses yet" description="Create your first operational expense." />
        </Card>
      ) : (
        filtered.map((item) => (
          <Card key={item.id}>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.type}</Text>
                <Text style={styles.meta}>{item.date}</Text>
              </View>
              <AppBadge label={formatCurrency(item.amount)} tone="warning" />
            </View>
            <Text style={styles.note}>{item.note || "No note"}</Text>
            <View style={styles.actions}>
              <AppButton title="Edit" icon="pencil" variant="secondary" compact onPress={() => openEdit(item)} />
              <AppButton title="Delete" icon="trash" variant="danger" compact onPress={() => confirmDelete(item)} />
            </View>
          </Card>
        ))
      )}

      <SheetModal visible={visible} title={editingId ? "Edit Expense" : "Add Expense"} subtitle="Store operational costs with date and note." onClose={() => setVisible(false)}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <Field label="Date">
            <AppInput value={form.date} onChangeText={(value) => setForm((current) => ({ ...current, date: value }))} />
          </Field>
          <Field label="Type">
            <View style={styles.typeRow}>
              {types.map((type) => (
                <Chip key={type} label={type} active={form.type === type} onPress={() => setForm((current) => ({ ...current, type }))} />
              ))}
            </View>
          </Field>
          <Field label="Amount">
            <AppInput value={String(form.amount)} onChangeText={(value) => setForm((current) => ({ ...current, amount: Number(value) || 0 }))} keyboardType="decimal-pad" />
          </Field>
          <Field label="Note">
            <AppInput value={form.note} onChangeText={(value) => setForm((current) => ({ ...current, note: value }))} placeholder="Optional" />
          </Field>
          <AppButton title={editingId ? "Save changes" : "Create expense"} icon="checkmark" onPress={saveExpense} />
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
    fontSize: 12,
    marginTop: 4,
  },
  note: {
    color: colors.muted,
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
  typeRow: {
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
