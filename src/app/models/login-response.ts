import { UserRole } from './user-role';

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  userId: number;
  userName: string;
  role: UserRole | string;
}
