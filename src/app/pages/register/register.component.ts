import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, CardModule, ToastModule, RouterLink],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);

  readonly registerForm: FormGroup = this.fb.nonNullable.group(
    {
      userName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.confirmPasswordValidator }
  );

  readonly isUserNameInvalid = computed(() => this.hasError('userName', 'required'));
  readonly isEmailInvalid = computed(() => this.hasError('email', 'required') || this.hasError('email', 'email'));
  readonly isPasswordInvalid = computed(() => this.hasError('password', 'required') || this.hasError('password', 'minlength'));
  readonly isConfirmPasswordInvalid = computed(() => this.hasError('confirmPassword', 'required') || this.hasPasswordMismatch());

  readonly hasPasswordMismatch = computed(() => {
    const control = this.registerForm;
    return !!control && control.hasError('passwordMismatch') && (control.dirty || control.touched);
  });

  submit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);

    const payload = this.registerForm.getRawValue();

    this.authService
      .register({
        userName: payload.userName,
        email: payload.email,
        password: payload.password,
        confirmPassword: payload.confirmPassword
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.messageService.add({ severity: 'success', summary: 'הצלחה', detail: 'ההרשמה בוצעה בהצלחה' });
          setTimeout(() => this.router.navigate(['/branches']), 800);
        },
        error: (error) => {
          this.loading.set(false);
          const status = error?.status;

          if (status === 400) {
            this.showError('הנתונים שהוזנו אינם תקינים');
            return;
          }

          if (status === 409) {
            this.showError('שם המשתמש או כתובת האימייל כבר קיימים במערכת.');
            return;
          }

          this.showError('אירעה שגיאה. נסה שוב מאוחר יותר.');
        }
      });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  private confirmPasswordValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'שגיאה', detail: message });
  }
}
