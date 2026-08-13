export interface ProductDto {
  productId: number;
  productName: string;
  model?: string | null;
  company?: string | null;
  notes?: string | null;
  purchasesCount: number;
}
