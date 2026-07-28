export interface CreatePurchaseDto {
  storeId: number;
  productId: number;
  quantity: number;
  pricePerUnit: number;
  purchasedBy?: string | null;
  purchaseDate?: string | null;
  receipt?: string | null;
  notes?: string | null;
}
