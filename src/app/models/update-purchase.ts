export interface UpdatePurchaseDto {
  storeId: number;
  productId: number;
  quantity: number;
  pricePerUnit: number;
  purchasedBy?: string | null;
  receipt?: string | null;
  notes?: string | null;
}
