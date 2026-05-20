// === Restaurant ===
export interface Restaurant {
  id: number;
  /** Opaque hash of id — use this in URLs, never the raw numeric id. */
  hashId: string;
  name: string;
  address: string;
  basePostcode: string;
  deliveryRadiusMiles: number;
  hygieneRating: number;
  isActive: boolean;
  imageUrl?: string | null;
  /** Pre-recorded kitchen video URL set by staff/admin. Null = no video yet. */
  kitchenVideoUrl?: string | null;
  /** Mux live stream playback ID. Non-null = stream is currently active. */
  liveStreamPlaybackId?: string | null;
  /** Broad cuisine category, e.g. "Indian", "Italian", "Burgers". */
  cuisineType: string;
  /** Advertised prep + delivery window in minutes. */
  estimatedDeliveryMinutes: number;
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
  imageUrl?: string | null;
}

// === Order ===
export interface Order {
  id: number;
  /** Opaque hash of id — use this in URLs, never the raw numeric id. */
  hashId: string;
  restaurantId: number;
  userId: number;
  status: OrderStatus;
  rejectionReason: string | null;
  disputeStatus: string;
  disputeNotes: string | null;
  totalAmount: number;
  deliveryAddressLine1: string;
  deliveryCity: string;
  deliveryPostcode: string;
  restaurantName: string;
  kitchenVideoUrl: string | null;
  /** Mux live stream playback ID from the restaurant. Non-null = stream active. */
  liveStreamPlaybackId: string | null;
  estimatedDeliveryTime: string | null;
  cancellableUntil: string;
  createdAt: string;
  deliveredAt: string | null;
  specialInstructions: string | null;
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
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface AuthResponse {
  token: string;
  role: 'Admin' | 'Staff' | 'Customer';
  username: string;
  userId: number;
  restaurantId: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/** Returned by POST /auth/register — no token yet; must verify email */
export interface RegisterResponse {
  email: string;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
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
  paymentIntentId?: string;
  specialInstructions?: string | null;
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

// === User ===
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Customer';
  isEmailVerified: boolean;
  restaurantId: number | null;
  createdAt: string;
}

/**
 * Canonical order status progression for the happy path.
 * (OCP: add a new status here once — staff dashboard, order-tracking and any future
 *  component that needs the flow picks it up automatically)
 */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Pending', 'Accepted', 'Preparing', 'Cooking', 'Packed', 'OutForDelivery', 'Delivered',
];

/** Returns the next status in the happy-path flow, or null if at the end. */
export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  return idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[idx + 1]
    : null;
}

// === Review ===
export interface Review {
  id: number;
  orderId: number;
  stars: number;
  comment: string | null;
  customerName: string;
  createdAt: string;
}

export interface SubmitReviewRequest {
  stars: number;
  comment?: string | null;
}
