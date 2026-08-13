export interface CreateLoan {
  deviceId: number;
  borrowerLastName?: string | null;
  address?: string | null;
  phone?: string | null;
  depositTypeId: number;
  notes?: string | null;
}
