import { PRODUCT_CATALOG, resolveProductImage } from "@/lib/catalog";
import {
  Expense,
  Product,
  Purchase,
  ReportScope,
  Sale,
  SaleItem,
  StockRow,
} from "@/lib/types";
import { formatCurrency, isSameDay, isSameMonth, makeId, normalizeNumber, sumBy, trimText } from "@/lib/storage";

export function normalizeProduct(product: Partial<Product>): Product {
  return {
    id: trimText(product.id) || makeId("prod"),
    name: trimText(product.name),
    category: trimText(product.category),
    unit: trimText(product.unit) || "kg",
    pricePerKg: normalizeNumber(product.pricePerKg),
    image: resolveProductImage(product.name || "", product.image),
    active: product.active !== false,
  };
}

export function normalizePurchase(purchase: Partial<Purchase>): Purchase {
  const quantity = normalizeNumber(purchase.quantity);
  const pricePerKg = normalizeNumber(purchase.pricePerKg);
  return {
    id: trimText(purchase.id) || makeId("pur"),
    date: trimText(purchase.date),
    supplierName: trimText(purchase.supplierName),
    productId: purchase.productId ?? null,
    vegetableName: trimText(purchase.vegetableName),
    quantity,
    pricePerKg,
    total: normalizeNumber(purchase.total) || quantity * pricePerKg,
  };
}

export function normalizeSaleItem(item: Partial<SaleItem>, products: Product[]): SaleItem | null {
  const product =
    products.find((entry) => entry.id === item.productId) ||
    products.find((entry) => entry.name.toLowerCase() === trimText(item.productName || "").toLowerCase());
  const productName = trimText(item.productName || product?.name || "");
  const qty = normalizeNumber(item.qty);
  const price = normalizeNumber(item.price || product?.pricePerKg);
  const unit = item.unit === "g" ? "g" : "kg";
  const total = unit === "g" ? (qty * price) / 1000 : qty * price;

  if (!productName || qty <= 0 || price <= 0) {
    return null;
  }

  return {
    id: trimText(item.id) || makeId("sale-item"),
    productId: item.productId ?? product?.id ?? null,
    productName,
    qty,
    unit,
    price,
    total: normalizeNumber(item.total) || total,
    image: resolveProductImage(productName, item.image || product?.image),
  };
}

export function normalizeSale(sale: Partial<Sale>, products: Product[]): Sale {
  const items = Array.isArray(sale.items)
    ? sale.items.map((item) => normalizeSaleItem(item, products)).filter(Boolean)
    : [];
  return {
    id: trimText(sale.id) || makeId("sal"),
    date: trimText(sale.date),
    customerName: trimText(sale.customerName),
    items: items as SaleItem[],
    grandTotal: normalizeNumber(sale.grandTotal) || sumBy(items as SaleItem[], (item) => item.total),
  };
}

export function normalizeExpense(expense: Partial<Expense>): Expense {
  return {
    id: trimText(expense.id) || makeId("exp"),
    date: trimText(expense.date),
    type: trimText(expense.type),
    amount: normalizeNumber(expense.amount),
    note: trimText(expense.note),
  };
}

export function buildStockRows(products: Product[], purchases: Purchase[], sales: Sale[]) {
  const map = new Map<string, StockRow>();

  products
    .filter((product) => product.active)
    .forEach((product) => {
      map.set(product.id, {
        productId: product.id,
        vegetableName: product.name,
        category: product.category,
        image: resolveProductImage(product.name, product.image),
        unit: product.unit,
        pricePerKg: product.pricePerKg,
        purchased: 0,
        sold: 0,
        remaining: 0,
      });
    });

  purchases.forEach((purchase) => {
    const key = purchase.productId || purchase.vegetableName.toLowerCase();
    const existing =
      map.get(key) || {
        productId: purchase.productId || key,
        vegetableName: purchase.vegetableName,
        category: "",
        image: resolveProductImage(purchase.vegetableName),
        unit: "kg",
        pricePerKg: purchase.pricePerKg,
        purchased: 0,
        sold: 0,
        remaining: 0,
      };

    existing.purchased += purchase.quantity;
    existing.remaining = existing.purchased - existing.sold;
    map.set(key, existing);
  });

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const key = item.productId || item.productName.toLowerCase();
      const existing =
        map.get(key) || {
          productId: item.productId || key,
          vegetableName: item.productName,
          category: "",
          image: resolveProductImage(item.productName, item.image),
          unit: item.unit,
          pricePerKg: item.price,
          purchased: 0,
          sold: 0,
          remaining: 0,
        };

      existing.sold += item.unit === "g" ? item.qty / 1000 : item.qty;
      existing.remaining = existing.purchased - existing.sold;
      map.set(key, existing);
    });
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      remaining: item.purchased - item.sold,
    }))
    .sort((left, right) => left.vegetableName.localeCompare(right.vegetableName));
}

export function buildReports(date: string, productId: string, purchases: Purchase[], sales: Sale[], expenses: Expense[]) {
  const target = date || new Date().toISOString().slice(0, 10);
  const filterId = productId || "";
  const selectedProduct = PRODUCT_CATALOG.find((item) => item.id === filterId);

  const filteredPurchases = purchases.filter((item) => {
    if (!isSameDay(item.date, target)) {
      return false;
    }

    if (!filterId) {
      return true;
    }

    return item.productId === filterId || item.vegetableName.toLowerCase() === selectedProduct?.name.toLowerCase();
  });

  const filteredSales = sales.filter((item) => {
    if (!isSameDay(item.date, target)) {
      return false;
    }

    if (!filterId) {
      return true;
    }

    return item.items.some((saleItem) => saleItem.productId === filterId || saleItem.productName.toLowerCase() === selectedProduct?.name.toLowerCase());
  });

  const filteredExpenses = expenses.filter((item) => isSameDay(item.date, target));

  return {
    purchases: filteredPurchases,
    sales: filteredSales,
    expenses: filteredExpenses,
    purchaseTotal: sumBy(filteredPurchases, (item) => item.total),
    salesTotal: sumBy(filteredSales, (item) => item.grandTotal),
    expensesTotal: sumBy(filteredExpenses, (item) => item.amount),
  } satisfies ReportScope;
}

export function buildMonthlyReports(date: string, productId: string, purchases: Purchase[], sales: Sale[], expenses: Expense[]) {
  const target = date || new Date().toISOString().slice(0, 10);
  const filterId = productId || "";
  const selectedProduct = PRODUCT_CATALOG.find((item) => item.id === filterId);

  const filteredPurchases = purchases.filter((item) => {
    if (!isSameMonth(item.date, target)) {
      return false;
    }

    if (!filterId) {
      return true;
    }

    return item.productId === filterId || item.vegetableName.toLowerCase() === selectedProduct?.name.toLowerCase();
  });

  const filteredSales = sales.filter((item) => {
    if (!isSameMonth(item.date, target)) {
      return false;
    }

    if (!filterId) {
      return true;
    }

    return item.items.some((saleItem) => saleItem.productId === filterId || saleItem.productName.toLowerCase() === selectedProduct?.name.toLowerCase());
  });

  const filteredExpenses = expenses.filter((item) => isSameMonth(item.date, target));

  return {
    purchases: filteredPurchases,
    sales: filteredSales,
    expenses: filteredExpenses,
    purchaseTotal: sumBy(filteredPurchases, (item) => item.total),
    salesTotal: sumBy(filteredSales, (item) => item.grandTotal),
    expensesTotal: sumBy(filteredExpenses, (item) => item.amount),
  } satisfies ReportScope;
}

export function makeDemoReportDate(purchases: Purchase[], sales: Sale[], expenses: Expense[]) {
  const dates = [...purchases, ...sales, ...expenses].map((item) => new Date(item.date)).filter((item) => !Number.isNaN(item.getTime()));
  if (dates.length === 0) {
    return new Date().toISOString().slice(0, 10);
  }

  return dates.reduce((latest, current) => (current > latest ? current : latest), new Date(0)).toISOString().slice(0, 10);
}
