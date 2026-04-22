Build a **mobile-friendly vegetable shop management system** using **Next.js (App Router)** and **React (with hooks)**. The app must use **localStorage for data persistence** (no backend, no database).

## 🔐 Authentication

* Create a simple **login page**
* Use static credentials (e.g., username: admin, password: 1234)
* Store login session in localStorage
* Redirect to dashboard after login
* Protect all routes (redirect to login if not logged in)

---

## 📱 UI Requirements

* Fully **mobile responsive**
* Use **simple clean UI (Tailwind CSS)** , shade cn ui library
* Bottom navigation bar for mobile
* Pages:

  * Dashboard
  * Purchases
  * Sales (Retail)
  * Expenses
  * Stock
  * Reports

---

## 📦 Features (ALL CRUD REQUIRED)

### 1. 🥬 Purchases Module

* Add Purchase:

  * Date
  * Supplier Name
  * Vegetable Name
  * Quantity (kg)
  * Price per kg
  * Total (auto calculate)
* Edit / Delete purchase
* Store in localStorage

---

### 2. 🛒 Sales (Retail Billing System)

* Create simple billing screen:

  * Add items (vegetable, qty, price)
  * Auto total calculation
  * Generate bill
* Fields:

  * Customer name (optional)
  * Date
  * Items list
  * Grand total
* Save each bill
* View past bills
* Delete bill

---

### 3. 💸 Expenses Module

* Add Expense:

  * Date
  * Type (rent, transport, salary, etc.)
  * Amount
  * Note
* Edit / Delete expense

---

### 4. 📦 Stock Management

* Auto-calculate stock:

  * Stock = Purchases - Sales
* Show:

  * Vegetable name
  * Total purchased
  * Total sold
  * Remaining stock

---

### 5. 📊 Dashboard

Show summary:

* Total Purchases (today / month)
* Total Sales
* Total Expenses
* Profit:
  Profit = Sales - Purchases - Expenses
* Low stock alert

---

### 6. 📈 Reports Page

* Daily report
* Monthly report
* Show:

  * Purchases
  * Sales
  * Expenses
  * Profit
* Filter by date

---

## 💾 Local Storage Structure

Use keys like:

* "purchases"
* "sales"
* "expenses"
* "userSession"

Store data as JSON arrays.

---

## ⚙️ Functional Requirements

* All CRUD operations (Create, Read, Update, Delete)
* Real-time calculations
* Form validation
* Toast notifications (success/error)
* Reusable components

---

## 🧩 Components to Create

* Navbar (mobile bottom nav)
* Form components
* Table/List view
* Bill generator component
* Dashboard cards

---

## 🎯 Extra Features (IMPORTANT)

* Search & filter data
* Sort lists
* Export bill as printable view
* Dark mode toggle
* Reset all data button

---

## 📁 Tech Stack

* Next.js (App Router)
* React Hooks
* Tailwind CSS
* localStorage API

---

## 🧠 Code Quality

* Clean and modular code
* Use reusable hooks (useLocalStorage)
* Separate logic and UI
* Simple folder structure

---

## 🎁 Final Output

* Fully working app
* Ready to run with:
  npm install
  npm run dev

Include:

* All pages
* Components
* Hooks
* Sample data

Make it beginner-friendly and easy to extend later with a real database.
