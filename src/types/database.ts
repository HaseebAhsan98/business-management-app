export type UserRole = "OWNER" | "MANAGER" | "SALESMAN";
export type DeliveryStatus = "PENDING" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentType = "CASH" | "CREDIT";
export type PaymentMethod = "CASH" | "BANK" | "WALLET" | "CHEQUE";
export type RateSource = "FIXED" | "PROFIT_ON_COST" | "DEFAULT_PROFIT" | "STANDARD" | "MANUAL";
export type RuleType = "PROFIT_ON_COST" | "FIXED_RATE";
export type PurchaseType = "NORMAL" | "OPENING";
export type MovementType = "PURCHASE" | "OPENING" | "SALE" | "SALE_REVERSAL" | "ADJUSTMENT" | "PURCHASE_CANCEL";

export interface UserProfile {
  id: string;
  name: string;
  phone: string | null;
  username: string | null;
  role: UserRole;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  company_id: string;
  name: string;
  sku: string;
  flavour: string | null;
  pack_size: string | null;
  pieces_per_carton: number;
  sale_rate_carton: number;
  last_purchase_rate_carton: number;
  min_stock_pieces: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  category?: Category;
  company?: Company;
}

export interface Customer {
  id: string;
  party_code: string;
  name: string;
  shop_name: string;
  phone: string | null;
  address: string | null;
  area_id: string;
  opening_balance: number;
  opening_balance_remaining: number;
  credit_days_limit: number;
  default_profit_per_carton: number;
  notes: string | null;
  merged_into_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  area?: Area;
}

export interface CustomerPriceRule {
  id: string;
  customer_id: string;
  product_id: string;
  rule_type: RuleType;
  amount_per_carton: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  opening_balance: number;
  current_balance: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  order_date: string;
  customer_id: string;
  salesman_id: string;
  created_by: string;
  updated_by: string | null;
  delivery_status: DeliveryStatus;
  delivered_at: string | null;
  payment_type: PaymentType;
  credit_days: number;
  due_date: string | null;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  balance: number;
  payment_status: PaymentStatus;
  total_cost?: number;
  profit?: number;
  override_reason: string | null;
  note: string | null;
  promise_date: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  customer?: Customer;
  salesman?: UserProfile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  qty_pieces: number;
  entered_unit: "CARTON" | "PIECE";
  rate_per_piece: number;
  rate_per_carton: number;
  rate_source: RateSource;
  cost_rate_per_piece?: number;
  line_total: number;
  cost_total?: number;
  line_profit?: number;
  sort_order: number;
  created_at: string;
  // Joins
  product?: Product;
}

export interface Purchase {
  id: string;
  purchase_no: string;
  purchase_type: PurchaseType;
  supplier_id: string | null;
  supplier_bill_no: string | null;
  purchase_date: string;
  total: number;
  paid: number;
  balance: number;
  due_date: string | null;
  note: string | null;
  status: "ACTIVE" | "CANCELLED";
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joins
  supplier?: Supplier;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  qty_pieces: number;
  qty_remaining_pieces: number;
  unit_cost_per_piece: number;
  rate_per_carton: number;
  line_total: number;
  created_at: string;
  // Joins
  product?: Product;
}

export interface CustomerPayment {
  id: string;
  receipt_no: string;
  customer_id: string;
  order_id: string | null;
  amount: number;
  method: PaymentMethod;
  payment_date: string;
  paid_at: string;
  balance_before: number;
  balance_after: number;
  note: string | null;
  received_by: string;
  status: "ACTIVE" | "REVERSED";
  reversal_reason: string | null;
  reversed_at: string | null;
  reversed_by: string | null;
  created_at: string;
  // Joins
  customer?: Customer;
  receiver?: UserProfile;
}
