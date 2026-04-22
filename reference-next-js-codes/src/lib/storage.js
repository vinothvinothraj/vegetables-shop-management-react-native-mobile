export const STORAGE_KEYS = {
  products: "products",
  purchases: "purchases",
  sales: "sales",
  expenses: "expenses",
  userSession: "userSession",
  theme: "theme",
  lang: "lang",
};

export function createPlaceholderImage(label = "Product") {
  const text = encodeURIComponent(label.slice(0, 2).toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10b981"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="200" height="200" rx="28" fill="url(#g)"/><circle cx="100" cy="100" r="58" fill="rgba(255,255,255,0.14)"/><text x="100" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function readStorage(key, fallback = null) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearStorageKeys(keys) {
  if (typeof window === "undefined") {
    return;
  }

  keys.forEach((key) => window.localStorage.removeItem(key));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(dateA, dateB) {
  return dateA.toISOString().slice(0, 10) === dateB.toISOString().slice(0, 10);
}

export function isSameMonth(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth()
  );
}

export function sumBy(items, getter) {
  return items.reduce((sum, item) => sum + Number(getter(item) || 0), 0);
}
