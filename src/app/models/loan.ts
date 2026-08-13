export interface Loan {
  loanId?: number;
  deviceId: number;
  deviceNumber?: string | null;
  categoryName?: string | null;
  branchName?: string | null;
  borrowerLastName?: string | null;
  address?: string | null;
  phone?: string | null;
  depositTypeId: number;
  depositTypeName?: string | null;
  loanDate?: string | null;
  returnDate?: string | null;
  isActive: boolean;
  notes?: string | null;
}
