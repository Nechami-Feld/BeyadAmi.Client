import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterLink],
  template: `
    <div class="unauthorized-page">
      <p-card>
        <div class="unauthorized-content">
          <h1>אין לך הרשאה לגשת למסך זה.</h1>
          <button pButton type="button" label="חזרה למסך הראשי" [routerLink]="'/branches'"></button>
        </div>
      </p-card>
    </div>
  `,
  styles: [
    `
      .unauthorized-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 1.5rem;
      }

      .unauthorized-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        text-align: center;
        direction: rtl;
      }

      h1 {
        margin: 0;
        color: #0f172a;
      }
    `
  ]
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);

  goHome(): void {
    this.router.navigate(['/branches']);
  }
}
