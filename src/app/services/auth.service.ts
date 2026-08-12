import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';

interface AuthUser {
  userId: number;
  userName: string;
}

interface StoredAuthSession {
  accessToken: string;
  expiresAt: string;
  userId: number;
  userName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'beyadami.auth';
  private readonly baseUrl = environment.apiUrl;

  readonly isAuthenticated = signal(false);
  readonly currentUser = signal<AuthUser | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly expiresAt = signal<string | null>(null);
  readonly redirectUrl = signal<string | null>(null);

  initialize(): void {
    const storedSession = this.readStoredSession();

    if (!storedSession) {
      this.clearSession();
      return;
    }

    if (this.isTokenExpired(storedSession.expiresAt)) {
      this.clearSession();
      return;
    }

    this.setSession(storedSession.accessToken, storedSession.expiresAt, {
      userId: storedSession.userId,
      userName: storedSession.userName
    });
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}api/auth/login`, request).pipe(
      tap((response) => {
        this.setSession(response.accessToken, response.expiresAt, {
          userId: response.userId,
          userName: response.userName
        });
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  setRedirectUrl(url: string | null): void {
    this.redirectUrl.set(url);
  }

  getRedirectUrl(): string {
    const nextUrl = this.redirectUrl();
    this.redirectUrl.set(null);
    return nextUrl ?? '/branches';
  }

  isTokenExpired(expiresAt?: string | null): boolean {
    if (!expiresAt) {
      return true;
    }

    return new Date(expiresAt).getTime() <= Date.now();
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.accessToken.set(null);
    this.expiresAt.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private setSession(accessToken: string, expiresAt: string, user: AuthUser): void {
    const session: StoredAuthSession = {
      accessToken,
      expiresAt,
      userId: user.userId,
      userName: user.userName
    };

    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.accessToken.set(accessToken);
    this.expiresAt.set(expiresAt);
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private readStoredSession(): StoredAuthSession | null {
    try {
      const item = localStorage.getItem(this.storageKey);

      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item) as Partial<StoredAuthSession>;

      if (
        typeof parsed.accessToken !== 'string' ||
        !parsed.accessToken ||
        typeof parsed.expiresAt !== 'string' ||
        !parsed.expiresAt ||
        typeof parsed.userId !== 'number' ||
        typeof parsed.userName !== 'string' ||
        !parsed.userName
      ) {
        return null;
      }

      return {
        accessToken: parsed.accessToken,
        expiresAt: parsed.expiresAt,
        userId: parsed.userId,
        userName: parsed.userName
      };
    } catch {
      return null;
    }
  }
}
