export interface Loan {
  loanId?: number;
  deviceId: number;
  deviceNumber?: string | null;
  deviceTypeName?: string | null;
  branchName?: string | null;
  borrowerFirstName?: string | null;
  borrowerLastName?: string | null;
  address?: string | null;
  phone?: string | null;
  depositTypeId: number;
  depositTypeName?: string | null;
  depositAmount?: number | null;
  loanDate?: string | null;
  returnDate?: string | null;
  isActive: boolean;
  notes?: string | null;
}
