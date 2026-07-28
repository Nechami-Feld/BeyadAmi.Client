export interface PurchaseDto {
  purchaseId: number;
  storeId: number;
  storeName?: string | null;
  productId: number;
  productName?: string | null;
  productModel?: string | null;
  productCompany?: string | null;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  purchasedBy?: string | null;
  purchaseDate: string;
  receipt?: string | null;
  notes?: string | null;
}
