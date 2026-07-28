export interface CreateBranchRequestRequest {
  branchId: number;
  requestDate: string;
  isCompleted: boolean;
  completedDate?: string | null;
  notes?: string | null;
}
