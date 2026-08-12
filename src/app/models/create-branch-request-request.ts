export interface CreateBranchRequestRequest {
  branchId: number;
  request: string;
  isCompleted: boolean;
  completedDate?: string | null;
  notes?: string | null;
}
