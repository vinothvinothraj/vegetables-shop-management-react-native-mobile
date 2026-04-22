"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  STORAGE_KEYS,
  clearStorageKeys,
  formatCurrency,
  isSameDay,
  isSameMonth,
  startOfMonth,
  sumBy,
  writeStorage,
} from "@/lib/storage";
import { isRemovedProductName, resolveProductImage } from "@/lib/product-catalog";
import { demoSeedData } from "@/lib/demo-data";
import { getDictionary } from "@/lib/i18n";
import { useLocalStorage } from "@/hooks/use-local-storage";

const AppContext = createContext(null);

function makeId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function isRemovedProduct(product) {
  return isRemovedProductName(product?.name);
}

function normalizeProduct(product) {
  return {
    id: product.id || makeId("prod"),
    name: normalizeText(product.name),
    category: normalizeText(product.category),
    unit: normalizeText(product.unit) || "kg",
    pricePerKg: Number(product.pricePerKg || 0),
    image: resolveProductImage(product.name, product.image),
    active: product.active !== false,
  };
}

function normalizePurchase(purchase) {
  return {
    ...purchase,
    quantity: Number(purchase.quantity || 0),
    pricePerKg: Number(purchase.pricePerKg || 0),
    total: Number(purchase.total || Number(purchase.quantity || 0) * Number(purchase.pricePerKg || 0)),
  };
}

function normalizeSale(sale) {
  return {
    ...sale,
    customerName: normalizeText(sale.customerName),
    grandTotal: Number(
      sale.grandTotal ||
        sumBy(sale.items || [], (item) => Number(item.total || getSaleItemTotal(item)))
    ),
    items: Array.isArray(sale.items)
      ? sale.items.map((item) => ({
          ...item,
          qty: Number(item.qty || 0),
          price: Number(item.price || 0),
          weightUnit: item.weightUnit === "g" ? "g" : "kg",
          total: Number(item.total || getSaleItemTotal(item)),
        }))
      : [],
  };
}

function getSaleQuantityInKg(item) {
  const qty = Number(item.qty || 0);
  return item.weightUnit === "g" ? qty / 1000 : qty;
}

function getSaleItemTotal(item) {
  const factor = item.weightUnit === "g" ? 100 : 1;
  return (Number(item.qty || 0) * Number(item.price || 0)) / factor;
}

function normalizeExpense(expense) {
  return {
    ...expense,
    amount: Number(expense.amount || 0),
    note: normalizeText(expense.note),
  };
}

function isMissingOrEmptyArray(key) {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    return true;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 0;
  } catch {
    return false;
  }
}

function pickProductName(item, product) {
  return normalizeText(
    item.productName ||
      item.vegetableName ||
      product?.name ||
      item.name ||
    ""
  );
}

function mergeProductCollections(currentProducts, seedProducts) {
  const currentById = new Map();
  const currentByName = new Map();

  currentProducts.map(normalizeProduct).filter((product) => !isRemovedProduct(product)).forEach((product) => {
    currentById.set(product.id, product);
    currentByName.set(product.name.toLowerCase(), product);
  });

  const merged = seedProducts.map((seed) => {
    const normalizedSeed = normalizeProduct(seed);
    if (isRemovedProduct(normalizedSeed)) {
      return null;
    }
    const existing = currentById.get(normalizedSeed.id) || currentByName.get(normalizedSeed.name.toLowerCase());

    if (!existing) {
      return normalizedSeed;
    }

    return normalizeProduct({
      ...normalizedSeed,
      ...existing,
      image: existing.image || normalizedSeed.image,
    });
  }).filter(Boolean);

  currentProducts.map(normalizeProduct).filter((product) => !isRemovedProduct(product)).forEach((product) => {
    const exists =
      merged.some((item) => item.id === product.id) ||
      merged.some((item) => item.name.toLowerCase() === product.name.toLowerCase());

    if (!exists) {
      merged.push(product);
    }
  });

  return merged;
}

function stripRemovedPurchases(purchases) {
  return purchases.filter((purchase) => !isRemovedProductName(purchase.vegetableName) && !isRemovedProductName(purchase.productName));
}

function stripRemovedSales(sales) {
  return sales
    .map((sale) => ({
      ...sale,
      items: (sale.items || []).filter(
        (item) => !isRemovedProductName(item.productName) && !isRemovedProductName(item.vegetableName)
      ),
    }))
    .filter((sale) => sale.items.length > 0);
}

function normaliseBillItems(items, products) {
  return items
    .map((item) => {
      const product =
        products.find((entry) => entry.id === item.productId) ||
        products.find((entry) => entry.name.toLowerCase() === normalizeText(item.productName || item.vegetableName).toLowerCase());

      const name = pickProductName(item, product);
      const qty = Number(item.qty || 0);
      const price = Number(item.price ?? product?.pricePerKg ?? 0);
      const weightUnit = item.weightUnit === "g" ? "g" : "kg";
      const total = (qty * price) / (weightUnit === "g" ? 100 : 1);

      if (!name || qty <= 0 || price <= 0) {
        return null;
      }

      return {
        id: item.id || makeId("bill-item"),
        productId: item.productId || product?.id || null,
        productName: name,
        vegetableName: name,
        qty,
        price,
        total,
        weightUnit,
        image: resolveProductImage(name, item.image || product?.image),
        unit: item.unit || product?.unit || "kg",
      };
    })
    .filter(Boolean);
}

function createReportFilter(productId) {
  return productId ? String(productId) : "";
}

function transactionMatchesProduct(record, productId) {
  if (!productId) {
    return true;
  }

  return record.productId === productId || record.items?.some((item) => item.productId === productId);
}

function defaultBillItem(products) {
  const firstProduct = products[0];

  return {
    id: makeId("bill-item"),
    productId: firstProduct?.id || "",
    productName: firstProduct?.name || "",
    vegetableName: firstProduct?.name || "",
    qty: 1,
    price: firstProduct?.pricePerKg || 0,
    total: firstProduct?.pricePerKg || 0,
    image: resolveProductImage(firstProduct?.name, firstProduct?.image),
    unit: firstProduct?.unit || "kg",
  };
}

export function AppProvider({ children }) {
  const router = useRouter();
  const [products, setProducts, productsHydrated] = useLocalStorage(
    STORAGE_KEYS.products,
    []
  );
  const [purchases, setPurchases, purchasesHydrated] = useLocalStorage(
    STORAGE_KEYS.purchases,
    []
  );
  const [sales, setSales, salesHydrated] = useLocalStorage(STORAGE_KEYS.sales, []);
  const [expenses, setExpenses, expensesHydrated] = useLocalStorage(
    STORAGE_KEYS.expenses,
    []
  );
  const [session, setSession] = useLocalStorage(STORAGE_KEYS.userSession, null);
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.theme, "light");
  const [lang, setLang] = useLocalStorage(STORAGE_KEYS.lang, "en");
  const [initialised, setInitialised] = useState(false);
  const safeProducts = Array.isArray(products) ? products : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeSales = Array.isArray(sales) ? sales : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const visibleProducts = useMemo(
    () => safeProducts.filter((product) => !isRemovedProduct(product)),
    [safeProducts]
  );
  const translate = (key) => getDictionary(lang)[key] || getDictionary("en")[key] || key;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = lang;
  }, [lang, theme]);

  useEffect(() => {
    if (!productsHydrated || !purchasesHydrated || !salesHydrated || !expensesHydrated || initialised) {
      return;
    }

    if (isMissingOrEmptyArray(STORAGE_KEYS.products) || !Array.isArray(products) || products.length === 0) {
      setProducts(mergeProductCollections([], demoSeedData.products));
    } else {
      setProducts((current) => mergeProductCollections(current, demoSeedData.products));
    }

    if (isMissingOrEmptyArray(STORAGE_KEYS.purchases) || !Array.isArray(purchases) || purchases.length === 0) {
      setPurchases(demoSeedData.purchases.map(normalizePurchase));
    } else {
      setPurchases((current) => stripRemovedPurchases(current).map(normalizePurchase));
    }

    if (isMissingOrEmptyArray(STORAGE_KEYS.sales) || !Array.isArray(sales) || sales.length === 0) {
      setSales(demoSeedData.sales.map(normalizeSale));
    } else {
      setSales((current) => stripRemovedSales(current).map(normalizeSale));
    }

    if (isMissingOrEmptyArray(STORAGE_KEYS.expenses) || !Array.isArray(expenses) || expenses.length === 0) {
      setExpenses(demoSeedData.expenses.map(normalizeExpense));
    } else {
      setExpenses((current) => current.map(normalizeExpense));
    }

    setInitialised(true);
  }, [
    expensesHydrated,
    initialised,
    productsHydrated,
    purchasesHydrated,
    salesHydrated,
    setExpenses,
    setProducts,
    setPurchases,
    setSales,
  ]);

  const addProduct = (product) => {
    const nextProduct = normalizeProduct({
      id: makeId("prod"),
      ...product,
    });

    setProducts((current) => [nextProduct, ...current]);
    return nextProduct;
  };

  const updateProduct = (id, product) => {
    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? normalizeProduct({
              ...item,
              ...product,
              id: item.id,
            })
          : item
      )
    );
  };

  const removeProduct = (id) => {
    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const getProductById = (id) => safeProducts.find((item) => item.id === id);

  const addPurchase = (purchase) => {
    const product = getProductById(purchase.productId);
    const quantity = Number(purchase.quantity);
    const pricePerKg = Number(purchase.pricePerKg);

    const nextPurchase = {
      id: makeId("pur"),
      ...purchase,
      productId: product?.id || purchase.productId || null,
      vegetableName: product?.name || normalizeText(purchase.vegetableName),
      quantity,
      pricePerKg,
      total: quantity * pricePerKg,
    };

    setPurchases((current) => [nextPurchase, ...current]);
    return nextPurchase;
  };

  const updatePurchase = (id, purchase) => {
    const product = getProductById(purchase.productId);
    setPurchases((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...purchase,
              productId: product?.id || purchase.productId || item.productId || null,
              vegetableName: product?.name || normalizeText(purchase.vegetableName),
              quantity: Number(purchase.quantity),
              pricePerKg: Number(purchase.pricePerKg),
              total: Number(purchase.quantity) * Number(purchase.pricePerKg),
            }
          : item
      )
    );
  };

  const removePurchase = (id) => {
    setPurchases((current) => current.filter((item) => item.id !== id));
  };

  const addSale = (sale) => {
    const items = normaliseBillItems(sale.items, visibleProducts);
    const nextSale = {
      id: makeId("sal"),
      date: sale.date,
      customerName: normalizeText(sale.customerName),
      items,
      grandTotal: sumBy(items, (item) => item.total),
    };

    setSales((current) => [nextSale, ...current]);
    return nextSale;
  };

  const updateSale = (id, sale) => {
    const items = normaliseBillItems(sale.items, visibleProducts);
    const nextSale = {
      id,
      date: sale.date,
      customerName: normalizeText(sale.customerName),
      items,
      grandTotal: sumBy(items, (item) => item.total),
    };

    setSales((current) => current.map((item) => (item.id === id ? nextSale : item)));
    return nextSale;
  };

  const removeSale = (id) => {
    setSales((current) => current.filter((item) => item.id !== id));
  };

  const addExpense = (expense) => {
    const nextExpense = {
      id: makeId("exp"),
      ...expense,
      amount: Number(expense.amount),
    };
    setExpenses((current) => [nextExpense, ...current]);
    return nextExpense;
  };

  const updateExpense = (id, expense) => {
    setExpenses((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...expense,
              amount: Number(expense.amount),
            }
          : item
      )
    );
  };

  const removeExpense = (id) => {
    setExpenses((current) => current.filter((item) => item.id !== id));
  };

  const resetDemoData = () => {
    clearStorageKeys([
      STORAGE_KEYS.products,
      STORAGE_KEYS.purchases,
      STORAGE_KEYS.sales,
      STORAGE_KEYS.expenses,
      STORAGE_KEYS.userSession,
    ]);
    setProducts(demoSeedData.products.map(normalizeProduct));
    setPurchases(demoSeedData.purchases.map(normalizePurchase));
    setSales(demoSeedData.sales.map(normalizeSale));
    setExpenses(demoSeedData.expenses.map(normalizeExpense));
    setSession(null);
    router.push("/login");
  };

  const signIn = (username, password) => {
    if (username !== "admin" || password !== "1234") {
      return { ok: false, message: translate("invalidCredentials") };
    }

    const nextSession = {
      username,
      loggedInAt: new Date().toISOString(),
    };

    setSession(nextSession);
    writeStorage(STORAGE_KEYS.userSession, nextSession);
    return { ok: true };
  };

  const signOut = () => {
    setSession(null);
    clearStorageKeys([STORAGE_KEYS.userSession]);
    router.push("/login");
  };

    const stockByProduct = useMemo(() => {
    const map = new Map();

    visibleProducts.forEach((product) => {
      map.set(product.id, {
        productId: product.id,
        vegetableName: product.name,
        category: product.category,
        image: resolveProductImage(product.name, product.image),
        unit: product.unit,
        pricePerKg: product.pricePerKg,
        purchased: 0,
        sold: 0,
      });
    });

    safePurchases.forEach((purchase) => {
      const key = purchase.productId || purchase.vegetableName?.trim().toLowerCase();
        const existing =
          map.get(key) || {
            productId: purchase.productId || key,
            vegetableName: purchase.vegetableName?.trim() || "Unknown",
            category: "",
            image: resolveProductImage(purchase.vegetableName),
            unit: "kg",
            pricePerKg: Number(purchase.pricePerKg || 0),
            purchased: 0,
            sold: 0,
        };

      existing.purchased += Number(purchase.quantity || 0);
      map.set(key, existing);
    });

    safeSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.productId || item.vegetableName?.trim().toLowerCase();
        const existing =
          map.get(key) || {
            productId: item.productId || key,
            vegetableName: item.vegetableName?.trim() || "Unknown",
            category: "",
            image: resolveProductImage(item.vegetableName, item.image),
            unit: item.unit || "kg",
            pricePerKg: Number(item.price || 0),
            purchased: 0,
            sold: 0,
          };

        existing.sold += getSaleQuantityInKg(item);
        map.set(key, existing);
      });
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        remaining: item.purchased - item.sold,
      }))
      .sort((a, b) => a.vegetableName.localeCompare(b.vegetableName));
  }, [safePurchases, safeSales, visibleProducts]);

  const totals = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);

    const purchaseToday = sumBy(
      safePurchases.filter((purchase) => isSameDay(new Date(purchase.date), today)),
      (item) => item.total
    );
    const purchaseMonth = sumBy(
      safePurchases.filter((purchase) => isSameMonth(new Date(purchase.date), today)),
      (item) => item.total
    );
    const totalPurchases = sumBy(safePurchases, (item) => item.total);
    const totalSales = sumBy(safeSales, (item) => item.grandTotal);
    const totalExpenses = sumBy(safeExpenses, (item) => item.amount);
    const profit = totalSales - totalPurchases - totalExpenses;

    return {
      purchaseToday,
      purchaseMonth,
      totalPurchases,
      totalSales,
      totalExpenses,
      profit,
      lowStock: stockByProduct.filter((item) => item.remaining <= 5),
      monthStart,
      totalProducts: visibleProducts.length,
    };
  }, [safeExpenses, safePurchases, safeSales, stockByProduct, visibleProducts.length]);

  const reportsForDate = (dateString, productId = "") => {
    const target = dateString ? new Date(dateString) : new Date();
    const filterId = createReportFilter(productId);

    const dailyPurchases = safePurchases.filter((item) => {
      if (!isSameDay(new Date(item.date), target)) {
        return false;
      }
      return !filterId || item.productId === filterId || item.vegetableName?.trim().toLowerCase() === getProductById(filterId)?.name?.toLowerCase();
    });

    const dailySales = safeSales.filter((item) => {
      if (!isSameDay(new Date(item.date), target)) {
        return false;
      }
      return !filterId || transactionMatchesProduct(item, filterId);
    });

    const dailyExpenses = safeExpenses.filter((item) => isSameDay(new Date(item.date), target));

    return {
      purchases: dailyPurchases,
      sales: dailySales,
      expenses: dailyExpenses,
      purchaseTotal: sumBy(dailyPurchases, (item) => item.total),
      salesTotal: sumBy(dailySales, (item) => item.grandTotal),
      expensesTotal: sumBy(dailyExpenses, (item) => item.amount),
    };
  };

  const reportsForMonth = (dateString, productId = "") => {
    const target = dateString ? new Date(dateString) : new Date();
    const filterId = createReportFilter(productId);

    const monthlyPurchases = safePurchases.filter((item) => {
      if (!isSameMonth(new Date(item.date), target)) {
        return false;
      }
      return !filterId || item.productId === filterId || item.vegetableName?.trim().toLowerCase() === getProductById(filterId)?.name?.toLowerCase();
    });
    const monthlySales = safeSales.filter((item) => {
      if (!isSameMonth(new Date(item.date), target)) {
        return false;
      }
      return !filterId || transactionMatchesProduct(item, filterId);
    });
    const monthlyExpenses = safeExpenses.filter((item) => isSameMonth(new Date(item.date), target));

    return {
      purchases: monthlyPurchases,
      sales: monthlySales,
      expenses: monthlyExpenses,
      purchaseTotal: sumBy(monthlyPurchases, (item) => item.total),
      salesTotal: sumBy(monthlySales, (item) => item.grandTotal),
      expensesTotal: sumBy(monthlyExpenses, (item) => item.amount),
    };
  };

  const value = {
    products: visibleProducts,
    purchases: safePurchases,
    sales: safeSales,
    expenses: safeExpenses,
    session,
    theme,
    setTheme,
    lang,
    setLang,
    t: translate,
    signIn,
    signOut,
    addProduct,
    updateProduct,
    removeProduct,
    addPurchase,
    updatePurchase,
    removePurchase,
    addSale,
    updateSale,
    removeSale,
    addExpense,
    updateExpense,
    removeExpense,
    resetDemoData,
    stockByProduct,
    totals,
    reportsForDate,
    reportsForMonth,
    formatCurrency,
    defaultBillItem: () => defaultBillItem(visibleProducts),
    getProductById: (id) => visibleProducts.find((item) => item.id === id),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
}
