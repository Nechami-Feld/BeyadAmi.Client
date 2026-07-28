export interface UpdateDeviceRequest {
  deviceNumber?: string | null;
  categoryId: number;
  branchId: number;
  company?: string | null;
  isAvailable: boolean;
  notes?: string | null;
}
