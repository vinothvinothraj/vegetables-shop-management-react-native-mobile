export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerKg: number;
  image: string;
  active: boolean;
};

export type Purchase = {
  id: string;
  date: string;
  supplierName: string;
  productId: string | null;
  vegetableName: string;
  quantity: number;
  pricePerKg: number;
  total: number;
};

export type SaleItem = {
  id: string;
  productId: string | null;
  productName: string;
  qty: number;
  unit: "kg" | "g";
  price: number;
  total: number;
  image: string;
};

export type Sale = {
  id: string;
  date: string;
  customerName: string;
  items: SaleItem[];
  grandTotal: number;
};

export type Expense = {
  id: string;
  date: string;
  type: string;
  amount: number;
  note: string;
};

export type StockRow = {
  productId: string;
  vegetableName: string;
  category: string;
  image: string;
  unit: string;
  pricePerKg: number;
  purchased: number;
  sold: number;
  remaining: number;
};

export type ReportScope = {
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  purchaseTotal: number;
  salesTotal: number;
  expensesTotal: number;
};

export type Session = {
  username: string;
  loggedInAt: string;
};

