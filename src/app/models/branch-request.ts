export interface BranchRequest {
  requestId?: number;
  branchId: number;
  branchName?: string | null;
  request: string;
  requestDate: string;
  isCompleted: boolean;
  completedDate?: string | null;
  notes?: string | null;
}
