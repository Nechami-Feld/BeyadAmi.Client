export interface CreateLoan {
  deviceId: number;
  borrowerFirstName?: string | null;
  borrowerLastName?: string | null;
  address?: string | null;
  phone?: string | null;
  depositTypeId: number;
  depositAmount?: number | null;
  notes?: string | null;
}
