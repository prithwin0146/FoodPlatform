// === Restaurant ===
export interface Restaurant {
  id: number;
  name: string;
  address: string;
  basePostcode: string;
  deliveryRadiusMiles: number;
  hygieneRating: number;
  isActive: boolean;
}

export interface RestaurantDetail extends Restaurant {
  hours: RestaurantHours[];
}

export interface RestaurantHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// === Menu ===
export interface MenuCategory {
  id: number;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  allergens: string | null;
  dietaryTags: string | null;
  isAvailable: boolean;
}

// === Order ===
export interface Order {
  id: number;
  restaurantId: number;
  userId: number;
  status: OrderStatus;
  rejectionReason: string | null;
  disputeStatus: string;
  disputeNotes: string | null;
  totalAmount: number;
  deliveryPostcode: string;
  estimatedDeliveryTime: string | null;
  cancellableUntil: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Preparing'
  | 'Cooking'
  | 'Packed'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Rejected'
  | 'Cancelled';

// === Auth ===
export interface AuthResponse {
  token: string;
  role: 'Admin' | 'Staff' | 'Customer';
  userId: number;
  restaurantId: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// === Cart ===
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// === DTOs ===
export interface PlaceOrderRequest {
  restaurantId: number;
  items: { menuItemId: number; quantity: number }[];
  deliveryAddressLine1: string;
  deliveryCity: string;
  deliveryPostcode: string;
  idempotencyKey: string;
  paymentMethodId?: string;
}

export interface AcceptOrderRequest {
  estimatedMinutes: number;
}

export interface RejectOrderRequest {
  reason: string;
}

export interface UpdateStatusRequest {
  status: string;
}

export interface DisputeRequest {
  notes: string;
}
