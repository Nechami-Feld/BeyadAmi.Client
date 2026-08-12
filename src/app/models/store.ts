export interface StoreDto {
  storeId: number;
  storeName: string;
  address: string;
  phone: string;
  email?: string | null;
  notes: string;
}
