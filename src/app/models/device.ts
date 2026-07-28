export interface Device {
  deviceId?: number;
  deviceNumber?: string | null;
  deviceTypeId: number;
  deviceTypeName?: string | null;
  categoryName?: string | null;
  branchId: number;
  branchName?: string | null;
  company?: string | null;
  isAvailable: boolean;
  notes?: string | null;
}
