export interface CreateDeviceCategoryRequest {
  categoryName: string;
  description?: string | null;
  deviceTypesCount?: number | null;
}
