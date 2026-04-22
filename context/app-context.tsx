import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCT_CATALOG } from "@/lib/catalog";
import {
  buildMonthlyReports,
  buildReports,
  buildStockRows,
  normalizeExpense,
  normalizeProduct,
  normalizePurchase,
  normalizeSale,
} from "@/lib/logic";
import { Expense, Product, Purchase, Sale, Session, StockRow } from "@/lib/types";
import { STORAGE_KEYS, isSameDay, isSameMonth, makeId, readStorage, removeStorage, sumBy, trimText, writeStorage } from "@/lib/storage";

type AppContextValue = {
  ready: boolean;
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  session: Session | null;
  signIn: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addPurchase: (purchase: Omit<Purchase, "id" | "total" | "vegetableName"> & { vegetableName?: string }) => Promise<Purchase>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  removePurchase: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, "id" | "grandTotal">) => Promise<Sale>;
  updateSale: (id: string, sale: Omit<Sale, "id" | "grandTotal">) => Promise<void>;
  removeSale: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<Expense>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  stockRows: StockRow[];
  totals: {
    totalProducts: number;
    totalPurchases: number;
    totalSales: number;
    totalExpenses: number;
    profit: number;
    lowStock: StockRow[];
    purchaseMonth: number;
    purchaseToday: number;
  };
  reportsForDate: (date: string, productId?: string) => ReturnType<typeof buildReports>;
  reportsForMonth: (date: string, productId?: string) => ReturnType<typeof buildMonthlyReports>;
  demoReportDate: string;
  resetData: () => Promise<void>;
  getProductById: (id: string | null) => Product | undefined;
};

const AppContext = createContext<AppContextValue | null>(null);

function sortByName(products: Product[]) {
  return [...products].sort((left, right) => left.name.localeCompare(right.name));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCT_CATALOG);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const [storedProducts, storedPurchases, storedSales, storedExpenses, storedSession] = await Promise.all([
        readStorage<Product[]>(STORAGE_KEYS.products, PRODUCT_CATALOG),
        readStorage<Purchase[]>(STORAGE_KEYS.purchases, []),
        readStorage<Sale[]>(STORAGE_KEYS.sales, []),
        readStorage<Expense[]>(STORAGE_KEYS.expenses, []),
        readStorage<Session | null>(STORAGE_KEYS.session, null),
      ]);

      if (!active) {
        return;
      }

      setProducts(sortByName(storedProducts.map(normalizeProduct)));
      setPurchases(storedPurchases.map(normalizePurchase));
      setSales(storedSales.map((sale) => normalizeSale(sale, storedProducts)));
      setExpenses(storedExpenses.map(normalizeExpense));
      setSession(storedSession);
      setReady(true);
    }

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    writeStorage(STORAGE_KEYS.products, products);
  }, [products, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    writeStorage(STORAGE_KEYS.purchases, purchases);
  }, [purchases, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    writeStorage(STORAGE_KEYS.sales, sales);
  }, [sales, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    writeStorage(STORAGE_KEYS.expenses, expenses);
  }, [expenses, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    writeStorage(STORAGE_KEYS.session, session);
  }, [ready, session]);

  const getProductById = (id: string | null) => products.find((item) => item.id === id);

  const addProduct = async (product: Omit<Product, "id">) => {
    const nextProduct = normalizeProduct({ ...product, id: makeId("prod") });
    setProducts((current) => sortByName([nextProduct, ...current]));
    return nextProduct;
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    setProducts((current) =>
      sortByName(
        current.map((item) => (item.id === id ? normalizeProduct({ ...item, ...product, id }) : item))
      )
    );
  };

  const removeProduct = async (id: string) => {
    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const addPurchase = async (purchase: Omit<Purchase, "id" | "total" | "vegetableName"> & { vegetableName?: string }) => {
    const product = getProductById(purchase.productId);
    const quantity = Number(purchase.quantity || 0);
    const pricePerKg = Number(purchase.pricePerKg || 0);
    const nextPurchase: Purchase = {
      id: makeId("pur"),
      date: trimText(purchase.date),
      supplierName: trimText(purchase.supplierName),
      productId: purchase.productId ?? null,
      vegetableName: trimText(purchase.vegetableName || product?.name),
      quantity,
      pricePerKg,
      total: quantity * pricePerKg,
    };

    setPurchases((current) => [nextPurchase, ...current]);
    return nextPurchase;
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    setPurchases((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const product = getProductById(purchase.productId ?? item.productId);
        const quantity = Number(purchase.quantity ?? item.quantity);
        const pricePerKg = Number(purchase.pricePerKg ?? item.pricePerKg);
        return {
          ...item,
          ...purchase,
          productId: purchase.productId ?? item.productId ?? null,
          vegetableName: trimText(purchase.vegetableName || product?.name || item.vegetableName),
          quantity,
          pricePerKg,
          total: quantity * pricePerKg,
        };
      })
    );
  };

  const removePurchase = async (id: string) => {
    setPurchases((current) => current.filter((item) => item.id !== id));
  };

  const addSale = async (sale: Omit<Sale, "id" | "grandTotal">) => {
    const items = sale.items
      .map((item) => {
        const product = getProductById(item.productId);
        const qty = Number(item.qty || 0);
        const price = Number(item.price || product?.pricePerKg || 0);
        const unit = item.unit === "g" ? "g" : "kg";
        const total = unit === "g" ? (qty * price) / 1000 : qty * price;
        if (!trimText(item.productName) || qty <= 0 || price <= 0) {
          return null;
        }
        return {
          ...item,
          id: item.id || makeId("sale-item"),
          productId: item.productId ?? product?.id ?? null,
          productName: trimText(item.productName || product?.name),
          qty,
          unit,
          price,
          total,
          image: item.image || product?.image || "",
        };
      })
      .filter(Boolean) as Sale["items"];

    const nextSale: Sale = {
      id: makeId("sal"),
      date: trimText(sale.date),
      customerName: trimText(sale.customerName),
      items,
      grandTotal: sumBy(items, (item) => item.total),
    };

    setSales((current) => [nextSale, ...current]);
    return nextSale;
  };

  const updateSale = async (id: string, sale: Omit<Sale, "id" | "grandTotal">) => {
    setSales((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const items = sale.items
          .map((saleItem) => {
            const product = getProductById(saleItem.productId);
            const qty = Number(saleItem.qty || 0);
            const price = Number(saleItem.price || product?.pricePerKg || 0);
            const unit = saleItem.unit === "g" ? "g" : "kg";
            const total = unit === "g" ? (qty * price) / 1000 : qty * price;
            if (!trimText(saleItem.productName) || qty <= 0 || price <= 0) {
              return null;
            }

            return {
              ...saleItem,
              id: saleItem.id || makeId("sale-item"),
              productId: saleItem.productId ?? product?.id ?? null,
              productName: trimText(saleItem.productName || product?.name),
              qty,
              unit,
              price,
              total,
              image: saleItem.image || product?.image || "",
            };
          })
          .filter(Boolean) as Sale["items"];

        return {
          ...item,
          ...sale,
          date: trimText(sale.date),
          customerName: trimText(sale.customerName),
          items,
          grandTotal: sumBy(items, (entry) => entry.total),
        };
      })
    );
  };

  const removeSale = async (id: string) => {
    setSales((current) => current.filter((item) => item.id !== id));
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    const nextExpense: Expense = {
      id: makeId("exp"),
      date: trimText(expense.date),
      type: trimText(expense.type),
      amount: Number(expense.amount || 0),
      note: trimText(expense.note),
    };

    setExpenses((current) => [nextExpense, ...current]);
    return nextExpense;
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    setExpenses((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...expense,
              date: trimText(expense.date ?? item.date),
              type: trimText(expense.type ?? item.type),
              amount: Number(expense.amount ?? item.amount),
              note: trimText(expense.note ?? item.note),
            }
          : item
      )
    );
  };

  const removeExpense = async (id: string) => {
    setExpenses((current) => current.filter((item) => item.id !== id));
  };

  const signIn = async (username: string, password: string) => {
    if (username !== "admin" || password !== "1234") {
      return { ok: false, message: "Invalid credentials" };
    }

    const nextSession: Session = {
      username,
      loggedInAt: new Date().toISOString(),
    };

    setSession(nextSession);
    await writeStorage(STORAGE_KEYS.session, nextSession);
    return { ok: true };
  };

  const signOut = async () => {
    setSession(null);
    await removeStorage([STORAGE_KEYS.session]);
  };

  const resetData = async () => {
    setProducts(PRODUCT_CATALOG);
    setPurchases([]);
    setSales([]);
    setExpenses([]);
    setSession(null);
    await removeStorage([
      STORAGE_KEYS.products,
      STORAGE_KEYS.purchases,
      STORAGE_KEYS.sales,
      STORAGE_KEYS.expenses,
      STORAGE_KEYS.session,
    ]);
  };

  const stockRows = useMemo(() => buildStockRows(products, purchases, sales), [products, purchases, sales]);
  const demoReportDate = useMemo(() => {
    const latest = [...purchases, ...sales, ...expenses].map((item) => item.date).sort().at(-1);
    return latest || new Date().toISOString().slice(0, 10);
  }, [expenses, purchases, sales]);

  const totals = useMemo(() => {
    const today = new Date();
    return {
      totalProducts: products.filter((item) => item.active).length,
      totalPurchases: sumBy(purchases, (item) => item.total),
      totalSales: sumBy(sales, (item) => item.grandTotal),
      totalExpenses: sumBy(expenses, (item) => item.amount),
      profit: sumBy(sales, (item) => item.grandTotal) - sumBy(purchases, (item) => item.total) - sumBy(expenses, (item) => item.amount),
      lowStock: stockRows.filter((item) => item.remaining <= 5),
      purchaseMonth: sumBy(
        purchases.filter((item) => isSameMonth(item.date, today)),
        (item) => item.total
      ),
      purchaseToday: sumBy(
        purchases.filter((item) => isSameDay(item.date, today)),
        (item) => item.total
      ),
    };
  }, [expenses, purchases, sales, stockRows, products]);

  const value: AppContextValue = {
    ready,
    products,
    purchases,
    sales,
    expenses,
    session,
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
    stockRows,
    totals,
    reportsForDate: (date: string, productId = "") => buildReports(date, productId, purchases, sales, expenses),
    reportsForMonth: (date: string, productId = "") => buildMonthlyReports(date, productId, purchases, sales, expenses),
    demoReportDate,
    resetData,
    getProductById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
