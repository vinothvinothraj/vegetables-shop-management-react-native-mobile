export type DemoProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerKg: number;
  image: string;
  active: boolean;
};

export type DemoPurchase = {
  id: string;
  date: string;
  supplierName: string;
  productId: string;
  vegetableName: string;
  quantity: number;
  pricePerKg: number;
  total: number;
};

export type DemoSaleItem = {
  id: string;
  productId: string;
  productName: string;
  vegetableName: string;
  qty: number;
  price: number;
  total: number;
  image: string;
  unit: string;
};

export type DemoSale = {
  id: string;
  date: string;
  customerName: string;
  items: DemoSaleItem[];
  grandTotal: number;
};

export type DemoExpense = {
  id: string;
  date: string;
  type: string;
  amount: number;
  note: string;
};

export type DemoStockRow = {
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

type DemoRecordWithDate = {
  date: string;
};

const demoProducts = [
  {
    id: "prod-carrot",
    name: "Carrot",
    category: "Root Veg",
    unit: "kg",
    pricePerKg: 300,
    image: "https://www.thespruceeats.com/thmb/pZ2yFDDyBmS9BVTSWasxKgAHJuE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/carrots1-355722c899f641de96a80e3c1aa666b4.jpg",
    active: true,
  },
  {
    id: "prod-leeks",
    name: "Leeks",
    category: "Allium",
    unit: "kg",
    pricePerKg: 340,
    image: "https://www.rkrvegetable.com/medias/products/small/153/20180108-163648.jpg",
    active: true,
  },
  {
    id: "prod-beetroot",
    name: "Beetroot",
    category: "Root Veg",
    unit: "kg",
    pricePerKg: 280,
    image: "https://vegpower.org.uk/wp-content/uploads/2022/07/shutterstock_535069978-scaled.jpg",
    active: true,
  },
  {
    id: "prod-potato",
    name: "Potato",
    category: "Root Veg",
    unit: "kg",
    pricePerKg: 260,
    image: "https://growhoss.com/cdn/shop/articles/potato_ecdbb7b2-3914-4edb-818d-eb6abfc66627_460x@2x.jpg?v=1761159166",
    active: true,
  },
  {
    id: "prod-onion",
    name: "Onion",
    category: "Allium",
    unit: "kg",
    pricePerKg: 220,
    image: "https://www.orgpick.com/cdn/shop/products/Organic-Onion_large_b56c7be1-0215-410a-9ef5-cb89d00b126b.jpg?v=1571986561",
    active: true,
  },
  {
    id: "prod-tomato",
    name: "Tomato",
    category: "Fresh",
    unit: "kg",
    pricePerKg: 260,
    image: "https://ajeanneinthekitchen.com/wp-content/uploads/2024/08/image.png?w=700",
    active: true,
  },
  {
    id: "prod-cabbage",
    name: "Cabbage",
    category: "Leafy Greens",
    unit: "kg",
    pricePerKg: 240,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVJ1zp6hZdZi9-No8KKcPceZjfBkjaN1y5Kg&s",
    active: true,
  },
  {
    id: "prod-spinach",
    name: "Spinach",
    category: "Leafy Greens",
    unit: "kg",
    pricePerKg: 180,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaD6rbm25Wnv4RiqSuc2yznskg2g_4CXvcaA&s",
    active: true,
  },
  {
    id: "prod-green-beans",
    name: "Green Beans",
    category: "Pods",
    unit: "kg",
    pricePerKg: 340,
    image: "https://www.incredibleseeds.ca/cdn/shop/products/BeanBush-Provider_460x@2x.jpg?v=1679716832",
    active: true,
  },
  {
    id: "prod-cucumber",
    name: "Cucumber",
    category: "Fresh",
    unit: "kg",
    pricePerKg: 230,
    image: "https://www.greendna.in/cdn/shop/products/cucumber_1_700x.jpg?v=1594219681",
    active: true,
  },
  {
    id: "prod-brinjal",
    name: "Brinjal",
    category: "Fresh",
    unit: "kg",
    pricePerKg: 250,
    image: "https://tropicalfresh.lk/wp-content/uploads/Untitled-design-2023-03-19T140324.048.jpg",
    active: true,
  },
  {
    id: "prod-okra",
    name: "Okra",
    category: "Pods",
    unit: "kg",
    pricePerKg: 280,
    image: "https://www.kikkoman.com/en/cookbook/assets/img/GlossaryOkra.jpg",
    active: true,
  },
  {
    id: "prod-pumpkin",
    name: "Pumpkin",
    category: "Fresh",
    unit: "kg",
    pricePerKg: 190,
    image: "https://edibleparadise.com/wp-content/uploads/2023/09/AdobeStock_523666468_kabocha-squash.jpg",
    active: true,
  },
  {
    id: "prod-sweet-potato",
    name: "Sweet Potato",
    category: "Root Veg",
    unit: "kg",
    pricePerKg: 240,
    image: "https://www.kikkoman.com/en/cookbook/assets/img/GlossarySweetPotatoes.jpg",
    active: true,
  },
  {
    id: "prod-radish",
    name: "Radish",
    category: "Root Veg",
    unit: "kg",
    pricePerKg: 200,
    image: "https://www.simplyseed.co.uk/user/products/large/Radish%20Albena.jpg",
    active: true,
  },
  {
    id: "prod-garlic",
    name: "Garlic",
    category: "Allium",
    unit: "kg",
    pricePerKg: 900,
    image: "https://objectstorage.ap-mumbai-1.oraclecloud.com/n/softlogicbicloud/b/cdn/o/products/310129--01--1555692321.jpeg",
    active: true,
  },
  {
    id: "prod-ginger",
    name: "Ginger",
    category: "Spicy",
    unit: "kg",
    pricePerKg: 850,
    image: "https://img.drz.lazcdn.com/static/lk/p/2042fd6f2b5e6917c6b252ace97524fa.jpg_720x720q80.jpg",
    active: true,
  },
  {
    id: "prod-capsicum",
    name: "Capsicum",
    category: "Fresh",
    unit: "kg",
    pricePerKg: 380,
    image: "https://img.drz.lazcdn.com/static/bd/p/72a39360663f3f610dfadfcad1f098b2.jpg_720x720q80.jpg",
    active: true,
  },
  {
    id: "prod-bottle-gourd",
    name: "Bottle Gourd",
    category: "Fresh",
    unit: "kg",
    pricePerKg: 180,
    image: "https://blog-images-1.pharmeasy.in/blog/production/wp-content/uploads/2022/07/22134631/22.jpg",
    active: true,
  },
  {
    id: "prod-bitter-gourd",
    name: "Bitter Gourd",
    category: "Spicy",
    unit: "kg",
    pricePerKg: 320,
    image: "https://i0.wp.com/plantcraft.in/wp-content/uploads/2020/12/bittergourdseeds_800x.jpg?fit=800%2C800&ssl=1",
    active: true,
  },
  {
    id: "prod-snake-gourd",
    name: "Snake Gourd",
    category: "Fresh",
    unit: "kg",
    pricePerKg: 180,
    image: "https://thumbs.dreamstime.com/b/fresh-green-snake-gourd-vegetables-hanging-market-close-up-shot-numerous-long-slender-ribbed-gourds-together-likely-411945394.jpg",
    active: true,
  },
] satisfies DemoProduct[];

export const demoSeedData = {
  products: demoProducts,
  purchases: [
    {
      id: "pur-002",
      date: "2026-04-03",
      supplierName: "Fresh Lanka",
      productId: "prod-carrot",
      vegetableName: "Carrot",
      quantity: 20,
      pricePerKg: 280,
      total: 5600,
    },
    {
      id: "pur-003",
      date: "2026-04-05",
      supplierName: "Island Growers",
      productId: "prod-tomato",
      vegetableName: "Tomato",
      quantity: 25,
      pricePerKg: 240,
      total: 6000,
    },
    {
      id: "pur-005",
      date: "2026-04-09",
      supplierName: "Harvest Depot",
      productId: "prod-leeks",
      vegetableName: "Leeks",
      quantity: 15,
      pricePerKg: 300,
      total: 4500,
    },
  ] satisfies DemoPurchase[],
  sales: [
    {
      id: "sal-001",
      date: "2026-04-02",
      customerName: "Sun Market",
      items: [
        {
          id: "sal-001-item-1",
          productId: "prod-tomato",
          productName: "Tomato",
          vegetableName: "Tomato",
          qty: 5,
          price: 320,
          total: 1600,
          image: "https://ajeanneinthekitchen.com/wp-content/uploads/2024/08/image.png?w=700",
          unit: "kg",
        },
        {
          id: "sal-001-item-2",
          productId: "prod-carrot",
          productName: "Carrot",
          vegetableName: "Carrot",
          qty: 3,
          price: 340,
          total: 1020,
          image: "https://www.thespruceeats.com/thmb/pZ2yFDDyBmS9BVTSWasxKgAHJuE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/carrots1-355722c899f641de96a80e3c1aa666b4.jpg",
          unit: "kg",
        },
      ],
      grandTotal: 2620,
    },
    {
      id: "sal-002",
      date: "2026-04-04",
      customerName: "City Cafe",
      items: [
        {
          id: "sal-002-item-2",
          productId: "prod-leeks",
          productName: "Leeks",
          vegetableName: "Leeks",
          qty: 2,
          price: 420,
          total: 840,
          image: "https://www.burpee.com/media/burpee20/default/Images/Content/CLP%20Vegetables/CATID-2370_Leeks.jpg",
          unit: "kg",
        },
      ],
      grandTotal: 840,
    },
    {
      id: "sal-004",
      date: "2026-04-08",
      customerName: "Fresh Mart",
      items: [
        {
          id: "sal-004-item-1",
          productId: "prod-tomato",
          productName: "Tomato",
          vegetableName: "Tomato",
          qty: 4,
          price: 330,
          total: 1320,
          image: "https://ajeanneinthekitchen.com/wp-content/uploads/2024/08/image.png?w=700",
          unit: "kg",
        },
      ],
      grandTotal: 1320,
    },
    {
      id: "sal-005",
      date: "2026-04-10",
      customerName: "",
      items: [
        {
          id: "sal-005-item-1",
          productId: "prod-carrot",
          productName: "Carrot",
          vegetableName: "Carrot",
          qty: 2,
          price: 360,
          total: 720,
          image: "https://www.thespruceeats.com/thmb/pZ2yFDDyBmS9BVTSWasxKgAHJuE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/carrots1-355722c899f641de96a80e3c1aa666b4.jpg",
          unit: "kg",
        },
        {
          id: "sal-005-item-2",
          productId: "prod-leeks",
          productName: "Leeks",
          vegetableName: "Leeks",
          qty: 1,
          price: 390,
          total: 390,
          image: "https://www.burpee.com/media/burpee20/default/Images/Content/CLP%20Vegetables/CATID-2370_Leeks.jpg",
          unit: "kg",
        },
      ],
      grandTotal: 1110,
    },
  ] satisfies DemoSale[],
  expenses: [
    {
      id: "exp-001",
      date: "2026-04-01",
      type: "Rent",
      amount: 25000,
      note: "Shop rent",
    },
    {
      id: "exp-002",
      date: "2026-04-04",
      type: "Transport",
      amount: 3500,
      note: "Market pickup",
    },
    {
      id: "exp-003",
      date: "2026-04-06",
      type: "Salary",
      amount: 42000,
      note: "Helper salary",
    },
    {
      id: "exp-004",
      date: "2026-04-08",
      type: "Utilities",
      amount: 7800,
      note: "Electricity and water",
    },
    {
      id: "exp-005",
      date: "2026-04-10",
      type: "Packaging",
      amount: 2600,
      note: "Bags and labels",
    },
  ] satisfies DemoExpense[],
  stock: demoProducts.map((product) => ({
    productId: product.id,
    vegetableName: product.name,
    category: product.category,
    image: product.image,
    unit: product.unit,
    pricePerKg: product.pricePerKg,
    purchased: 0,
    sold: 0,
    remaining: 0,
  })) satisfies DemoStockRow[],
} satisfies {
  products: DemoProduct[];
  purchases: DemoPurchase[];
  sales: DemoSale[];
  expenses: DemoExpense[];
  stock: DemoStockRow[];
};

function latestDateFromRecords(records: DemoRecordWithDate[]): Date {
  return records.reduce<Date>((latest, record) => {
    const current = new Date(record.date);
    return !latest || current > latest ? current : latest;
  }, new Date(0));
}

const latestDemoDate: Date =
  latestDateFromRecords([
    ...demoSeedData.purchases,
    ...demoSeedData.sales,
    ...demoSeedData.expenses,
  ]) || new Date();

export const demoDefaultReportDate = latestDemoDate.toISOString().slice(0, 10);
