// Shapes returned by servekaro-backend (see servekaro-backend/API.md).
// Money is integer paise. Ids are strings.

export type Id = string;
export type FoodType = 'veg' | 'nonveg' | 'egg';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMode = 'cash' | 'card' | 'upi' | 'wallet' | 'online' | 'due';
export type Permission =
  | 'menu.view' | 'menu.edit' | 'tables.manage'
  | 'orders.create' | 'orders.cancelItem' | 'orders.accept' | 'kot.update'
  | 'bills.create' | 'bills.discount' | 'bills.void' | 'bills.reprint' | 'bills.complimentary'
  | 'payments.collect' | 'payments.refund'
  | 'customers.view' | 'customers.edit' | 'inventory.view' | 'inventory.edit'
  | 'shift.manage' | 'expenses.edit' | 'reports.view' | 'staff.manage' | 'settings.edit';

export interface ApiError {
  status: number | 'FETCH_ERROR' | 'PARSING_ERROR' | 'TIMEOUT_ERROR' | 'CUSTOM_ERROR';
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

// --- auth / staff -------------------------------------------------------------

export interface User {
  id: Id;
  name: string;
  email?: string;
  phone?: string;
  roleId: Id;
  outletIds: Id[];
  isActive: boolean;
  emailVerified: boolean;
  hasPin: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface RoleSummary { id: Id; name: string; isOwner: boolean; maxDiscountPercent: number }

export interface OutletSummary { id: Id; name: string; slug: string; city: string }

export interface Profile {
  user: User;
  role: RoleSummary;
  permissions: Permission[];
  outlets: OutletSummary[];
}

export interface AuthResult extends Profile { accessToken: string; outletId?: Id }

export interface Role {
  id: Id;
  name: string;
  permissions: Permission[];
  maxDiscountPercent: number;
  isOwner: boolean;
}

export interface Device { id: Id; name: string; outletId: Id; lastUsedAt?: string; createdAt: string }

// --- outlet / restaurant / taxes --------------------------------------------

export interface Outlet {
  id: Id;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  fssai: string;
  timezone: string;
  billPrefix: string;
  financialYearStart: string;
  pricesIncludeTax: boolean;
  roundOff: 'nearest_rupee' | 'none';
  serviceCharge: { enabled: boolean; percent: number; orderTypes: OrderType[] };
  orderTypes: OrderType[];
  qrOrdering: { enabled: boolean; requireAcceptance: boolean; allowPayLater: boolean };
  bill: { header: string; footer: string; showItemTax: boolean };
  theme: { primaryColor: string; accentColor: string; logoUrl: string };
  isOpen: boolean;
}

export type PublicOutlet = Pick<Outlet, 'id' | 'name' | 'slug' | 'address' | 'phone' | 'theme' | 'isOpen' | 'pricesIncludeTax' | 'qrOrdering' | 'orderTypes'>;

export interface Restaurant { id: Id; name: string; legalName: string; pan: string; logoUrl: string }

export interface TaxComponent { name: string; rate: number }
export interface TaxGroup { id: Id; name: string; components: TaxComponent[] }

// --- menu ---------------------------------------------------------------------

export interface Station { id: Id; name: string }

export interface Category {
  id: Id;
  name: string;
  sortOrder: number;
  isActive: boolean;
  availability?: { days: number[]; from: string; to: string } | null;
}

export interface Addon { id: Id; name: string; price: number; foodType: FoodType; isActive: boolean }
export interface AddonGroup { id: Id; name: string; min: number; max: number; addons: Addon[] }

export interface Variant { id: Id; name: string; price: number }
export interface MenuImage { id: Id; url: string; publicId?: string; isPrimary: boolean }
export type ItemTag = 'popular' | 'chefSpecial' | 'new' | 'spicy';

export interface MenuItem {
  id: Id;
  categoryId: Id;
  name: string;
  shortCode?: string;
  description: string;
  foodType: FoodType;
  price: number;
  variants: Variant[];
  addonGroupIds: Id[];
  taxGroupId?: Id | null;
  hsn?: string;
  stationId?: Id | null;
  prepTimeMin: number;
  tags: ItemTag[];
  inStock: boolean;
  isActive: boolean;
  images: MenuImage[];
  orderTypePrices?: Partial<Record<OrderType, number>>;
  sortOrder: number;
}

export interface Menu {
  categories: Category[];
  items: MenuItem[];
  addonGroups: AddonGroup[];
  taxGroups: TaxGroup[];
  stations: Station[];
}

export type PublicMenu = Pick<Menu, 'categories' | 'items' | 'addonGroups'>;

// --- tables -----------------------------------------------------------------

export type TableStatus = 'free' | 'occupied' | 'billed';
export interface Area { id: Id; name: string; sortOrder: number }
export interface Table {
  id: Id;
  name: string;
  areaId?: Id | null;
  capacity: number;
  isActive: boolean;
  status: TableStatus;
  orderId: Id | null;
  since?: string | null;
  amount: number;
  qrUrl: string;
  sortOrder: number;
}

// --- orders / KOT -------------------------------------------------------------

export interface TaxLine { name: string; rate: number; taxable: number; amount: number }
export interface Amounts {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  taxes: TaxLine[];
  roundOff: number;
  total: number;
}

export type OrderStatus = 'awaiting_acceptance' | 'open' | 'billed' | 'settled' | 'cancelled';
export type OrderItemStatus = 'awaiting_acceptance' | 'active' | 'cancelled';

export interface OrderItem {
  id: Id;
  itemId: Id;
  name: string;
  variantId?: Id;
  variantName?: string;
  addons: { addonId: Id; name: string; price: number }[];
  qty: number;
  unitPrice: number;
  foodType?: FoodType;
  note: string;
  kotId: Id | null;
  status: OrderItemStatus;
  cancelledQty: number;
  cancelReason?: string;
  addedAt: string;
}

export interface Order {
  id: Id;
  orderNo: number;
  businessDate: string;
  type: OrderType;
  source: 'pos' | 'qr' | 'zomato' | 'swiggy';
  status: OrderStatus;
  tableId: Id | null;
  tableName?: string;
  covers: number;
  captainId?: Id;
  customer?: { name?: string; phone?: string };
  note: string;
  items: OrderItem[];
  amounts: Amounts;
  billId: Id | null;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type KotStatus = 'pending' | 'preparing' | 'ready' | 'served';
export interface Kot {
  id: Id;
  kotNo: number;
  orderId: Id;
  orderNo: number;
  orderType: OrderType;
  tableName?: string;
  stationId: Id | null;
  type: 'new' | 'cancel';
  items: { orderItemId: Id; name: string; variantName?: string; addons: string[]; qty: number; note: string }[];
  status: KotStatus;
  printCount: number;
  createdAt: string;
}

export interface OrderItemInput {
  itemId: Id;
  variantId?: Id;
  addonIds?: Id[];
  qty: number;
  note?: string;
}

// --- bills / shifts -----------------------------------------------------------

export type BillStatus = 'unpaid' | 'partly_paid' | 'paid' | 'void';
export interface Discount { kind: 'percent' | 'flat'; value: number; reason: string }

export interface Payment {
  id: Id;
  mode: PaymentMode;
  amount: number;
  reference: string;
  refunded: number;
  at: string;
}

export interface Bill {
  id: Id;
  billNo: string;
  businessDate: string;
  orderId: Id;
  orderNo: number;
  orderType: OrderType;
  tableName?: string;
  lines: { itemId: Id; name: string; qty: number; unitPrice: number; amount: number; hsn: string; taxRate: number }[];
  amounts: Amounts;
  discounts: (Discount & { amount: number; approvedBy?: Id })[];
  payments: Payment[];
  refunds: { id: Id; paymentId: Id; mode: PaymentMode; amount: number; reason: string; at: string }[];
  paid: number;
  due: number;
  status: BillStatus;
  isComplimentary: boolean;
  customer?: { name?: string; phone?: string; gstin?: string };
  voidReason?: string;
  printCount: number;
  createdAt: string;
}

export interface Approval { pin: string }

export interface ShiftCash { openingCash: number; cashSales: number; cashMovements: number; expected: number }
export interface Shift {
  id: Id;
  status: 'open' | 'closed';
  businessDate: string;
  openedBy: Id;
  openedAt: string;
  openingCash: number;
  cashMovements: { id: Id; kind: 'in' | 'out'; amount: number; reason: string; at: string }[];
  closedAt?: string;
  expectedCash?: number;
  countedCash?: number;
  difference?: number;
  cash?: ShiftCash;
}

// --- reports ------------------------------------------------------------------

export interface Dashboard {
  date: string;
  sales: number;
  bills: number;
  avgBill: number;
  orders: number;
  covers: number;
  runningTables: number;
  runningAmount: number;
  topItems: { id: Id; name: string; qty: number; amount: number }[];
  byHour: { hour: number; amount: number; bills: number }[];
}

export interface SalesRow { key: string; bills: number; gross: number; discount: number; serviceCharge: number; tax: number; roundOff: number; net: number }
export interface PaymentRow { mode: PaymentMode; count: number; amount: number; refunded: number; net: number }
export interface ItemRow { id: Id; name: string; qty: number; amount: number }
export interface TaxReport {
  byRate: { name: string; rate: number; taxable: number; amount: number }[];
  byHsn: { hsn: string; rate: number; qty: number; value: number }[];
}

export interface DayEnd {
  date: string;
  sales: Omit<SalesRow, 'key'>;
  payments: PaymentRow[];
  taxes: TaxReport['byRate'];
  void: { count: number; amount: number };
  complimentary: { count: number; amount: number };
  shifts: { id: Id; status: string; openedAt: string; closedAt?: string; openingCash: number; expectedCash?: number; countedCash?: number; difference?: number }[];
}

export interface AuditEntry {
  id: Id;
  action: string;
  userName?: string;
  approvedBy?: Id;
  entity?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// --- public (customer QR) -------------------------------------------------------

export interface QrContext { outlet: PublicOutlet; table: { id: Id; name: string }; menu: PublicMenu }

export interface PlacedOrder { orderId: Id; orderNo: number; trackingToken: string; status: OrderStatus }

export interface TrackedOrder {
  orderId: Id;
  orderNo: number;
  status: OrderStatus;
  tableName?: string;
  items: { name: string; variantName?: string; addons: string[]; qty: number; status: OrderItemStatus; kitchenStatus: KotStatus | null }[];
  amounts: Amounts;
  bill: { billNo: string; status: BillStatus; total: number; paid: number; due: number } | null;
  createdAt: string;
}
