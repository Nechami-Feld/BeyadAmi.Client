export interface CreateDeviceRequest {
  deviceNumber?: string | null;
  deviceTypeId: number;
  branchId: number;
  company?: string | null;
  isAvailable: boolean;
  notes?: string | null;
}
