export interface UpdateStoreRequest {
  storeName: string;
  address: string;
  phone: string;
  email?: string | null;
  notes: string;
  productsCount: number;
}
