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
  /** Angelcam Camera ID. Non-null = live stream is currently active for this restaurant. */
  angelcamCameraId?: string | null;
  /** Broad cuisine category, e.g. "Indian", "Italian", "Burgers". */
  cuisineType: string;
  /** Advertised prep + delivery window in minutes. */
  estimatedDeliveryMinutes: number;
  /** Restaurant contact phone number. */
  phone?: string | null;
  /** When true, customers can choose collection (pickup) instead of delivery. */
  supportsCollection: boolean;
}

export interface RestaurantDetail extends Restaurant {
  hours: RestaurantHours[];
  /** Currently active promotions for this restaurant. */
  activePromotions?: RestaurantPromotion[];
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
  allergens: string[];
  dietaryTags: string[];
  isAvailable: boolean;
  imageUrl?: string | null;
  trackStock: boolean;
  stockCount: number | null;
}

// === Inventory ===
export interface InventoryItem {
  id: number;
  name: string;
  categoryName: string;
  isAvailable: boolean;
  trackStock: boolean;
  stockCount: number | null;
}

export interface MenuImportResult {
  created: number;
  categoriesCreated: number;
  skipped: number;
  errors: string[];
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
  /** Angelcam Camera ID from the restaurant. Non-null = live kitchen stream is active. */
  angelcamCameraId: string | null;
  /** Restaurant contact phone number. Shown on the order-tracking page for customer queries. */
  restaurantPhone: string | null;
  estimatedDeliveryTime: string | null;
  cancellableUntil: string;
  createdAt: string;
  deliveredAt: string | null;
  specialInstructions: string | null;
  items: OrderItem[];
  /** 'Delivery' or 'Collection'. */
  orderType: string;
  /** ISO timestamp of the scheduled time, or null for ASAP. */
  scheduledFor: string | null;
  /** Platform-wide promo code applied (if any). */
  promoCode: string | null;
  /** Amount discounted via promo code (£). */
  discountAmount: number;
  /** Gift card code applied (if any). */
  giftCardCode: string | null;
  /** Amount redeemed from a gift card (£). */
  giftCardDiscount: number;
  /** Delivery fee charged on this order (£). Zero for collection and Plus members. */
  deliveryFee: number;
  /** SeeThePrep Rewards account credit applied to this order (£). */
  creditApplied?: number;
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
  | 'Cancelled'
  | 'Cancelling';

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
  deliveryAddressLine1?: string | null;
  deliveryCity?: string | null;
  deliveryPostcode?: string | null;
  idempotencyKey: string;
  paymentIntentId?: string;
  specialInstructions?: string | null;
  orderType?: string;
  scheduledFor?: string | null;
  /** Platform-wide promo code to apply at checkout. */
  promoCode?: string | null;
  /** Gift card code to redeem at checkout. */
  giftCardCode?: string | null;
  /** Whether to apply available SeeThePrep Rewards account credit at checkout. */
  useAccountCredit?: boolean;
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

// === Phase 2: Promo Codes ===
export interface PromoCode {
  id: number;
  code: string;
  description: string;
  discountType: string; // 'Percentage' | 'Fixed'
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ValidatePromoCodeResponse {
  isValid: boolean;
  message: string;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
}

export interface CreatePromoCodeRequest {
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null;
}

// === Phase 2: Restaurant Promotions ===
export interface RestaurantPromotion {
  id: number;
  restaurantId: number;
  title: string;
  description: string | null;
  discountType: string; // 'PercentageOff' | 'FixedOff'
  discountValue: number;
  appliesToCategoryId: number | null;
  appliesToCategoryName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRestaurantPromotionRequest {
  title: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  appliesToCategoryId?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

// === Auctions ===
export type AuctionStatus = 'Draft' | 'Scheduled' | 'Live' | 'Ended' | 'Sold' | 'Unsold';

export interface Auction {
  id: number;
  restaurantId: number;
  restaurantName: string;
  menuItemId: number | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startingPrice: number;
  currentBid: number | null;
  bidIncrement: number;
  buyNowPrice: number | null;
  /** Angelcam Camera ID for the auction live stream. */
  cameraId: string | null;
  status: AuctionStatus;
  startsAt: string | null;
  endsAt: string | null;
  softCloseSeconds: number;
  bidCount: number;
  winningUserName: string | null;
  createdAt: string;
}

export interface Bid {
  id: number;
  auctionId: number;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export interface CreateAuctionRequest {
  menuItemId?: number | null;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startingPrice: number;
  bidIncrement?: number | null;
  buyNowPrice?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  softCloseSeconds?: number | null;
}

export interface UpdateAuctionRequest {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  startingPrice?: number;
  bidIncrement?: number;
  buyNowPrice?: number | null;
  endsAt?: string | null;
}


// === Phase 2: Subscriptions ===
export interface SubscriptionStatus {
  isActive: boolean;
  status: string | null;
  periodEnd: string | null;
  createdAt: string | null;
}

// === Phase 2: Gift Cards ===
export interface GiftCard {
  id: number;
  code: string;
  initialAmount: number;
  remainingBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface ValidateGiftCardResponse {
  isValid: boolean;
  message: string;
  remainingBalance: number | null;
}

// === Free loyalty program (stamps + account credit) ===
export interface LoyaltyTransactionDto {
  id: number;
  type: string;
  amount: number;
  orderId: number | null;
  note: string | null;
  createdAt: string;
}

export interface LoyaltyStatusDto {
  stampCount: number;
  stampsRequiredForReward: number;
  accountCreditBalance: number;
  recentTransactions: LoyaltyTransactionDto[];
}

export interface RedeemStampRewardResponse {
  success: boolean;
  message: string;
  creditAwarded: number;
  newAccountCreditBalance: number;
}

