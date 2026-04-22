import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  products: "products",
  purchases: "purchases",
  sales: "sales",
  expenses: "expenses",
  session: "session",
} as const;

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function trimText(value: unknown) {
  return String(value ?? "").trim();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function toDateKey(value: string | Date) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

export function isSameDay(dateA: string | Date, dateB: string | Date) {
  return toDateKey(dateA) === toDateKey(dateB);
}

export function isSameMonth(dateA: string | Date, dateB: string | Date) {
  const left = new Date(dateA);
  const right = new Date(dateB);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function startOfMonth(date: string | Date = new Date()) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function sumBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((sum, item) => sum + Number(getter(item) || 0), 0);
}

export async function readStorage<T>(key: string, fallback: T) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeStorage<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeStorage(keys: string[]) {
  await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
}

export function normalizeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

