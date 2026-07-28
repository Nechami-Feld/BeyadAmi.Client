export interface Branch {
  branchId?: number;
  branchName: string;
  city?: string | null;
  street?: string | null;
  apartment?: string | null;
  managerLastName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive: boolean;
}
