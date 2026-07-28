export interface Device {
  deviceId?: number;
  deviceNumber?: string | null;
  categoryId: number;
  categoryName?: string | null;
  branchId: number;
  branchName?: string | null;
  company?: string | null;
  isAvailable: boolean;
  notes?: string | null;
}
