export interface CreateProductDto {
  productName: string;
  model?: string | null;
  company?: string | null;
  notes?: string | null;
}
