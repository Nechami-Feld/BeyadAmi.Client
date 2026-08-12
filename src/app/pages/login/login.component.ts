import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);

  readonly loginForm: FormGroup = this.fb.nonNullable.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  readonly userNameControl = this.loginForm.get('userName');
  readonly passwordControl = this.loginForm.get('password');

  readonly isUserNameInvalid = computed(() => this.hasError('userName', 'required'));
  readonly isPasswordInvalid = computed(() => this.hasError('password', 'required'));

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.authService.getRedirectUrl());
    }
  }

  submit(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);

    const payload = this.loginForm.getRawValue();

    this.authService
      .login({
        userName: payload.userName,
        password: payload.password
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          const returnUrl = this.authService.getRedirectUrl();
          this.router.navigateByUrl(returnUrl);
        },
        error: (error) => {
          this.loading.set(false);
          const status = error?.status;

          if (status === 401) {
            this.showError('שם המשתמש או הסיסמה שגויים');
            return;
          }

          if (status === 400) {
            this.showError('הנתונים שהוזנו אינם תקינים');
            return;
          }

          this.showError('אירעה שגיאה. נסה שוב מאוחר יותר.');
        }
      });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'שגיאה', detail: message });
  }
}
