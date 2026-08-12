export interface UpdateBranchRequestRequest {
  branchId: number;
  request: string;
  requestDate: string;
  isCompleted: boolean;
  completedDate?: string | null;
  notes?: string | null;
}
