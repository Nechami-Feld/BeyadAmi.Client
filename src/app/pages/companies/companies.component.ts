import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CompanyDto } from '../../models/company';
import { CreateCompanyDto } from '../../models/create-company';
import { UpdateCompanyDto } from '../../models/update-company';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    InputTextModule,
    ToolbarModule,
    ToastModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss'
})
export class CompaniesComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly companies = signal<CompanyDto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedCompanyId = signal<number | null>(null);

  readonly filteredCompanies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.companies()) ? this.companies() : [];

    if (!term) {
      return source;
    }

    return source.filter((c) =>
      c.companyName?.toLowerCase().includes(term)
    );
  });

  readonly companyForm: FormGroup = this.fb.nonNullable.group({
    companyName: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);

    this.companyService
      .getCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (companies) => this.companies.set(Array.isArray(companies) ? companies : []),
        error: () => this.showError('לא ניתן לטעון חברות. אנא נסה שוב.')
      });
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedCompanyId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(company: CompanyDto): void {
    this.isEditMode.set(true);
    this.selectedCompanyId.set(company.companyId ?? null);
    this.resetForm();
    this.dialogVisible.set(true);

    if (company.companyId !== undefined) {
      this.loadCompanyDetails(company.companyId);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  saveCompany(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.companyForm.getRawValue();

    const saveRequest = this.isEditMode() && this.selectedCompanyId() !== null
      ? this.companyService.updateCompany(this.selectedCompanyId()!, {
          companyName: formValue.companyName,
        } as UpdateCompanyDto)
      : this.companyService.createCompany({
          companyName: formValue.companyName,
        } as CreateCompanyDto);

    saveRequest
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.resetForm();
          this.loadCompanies();
          this.showSuccess(this.isEditMode() ? 'החברה עודכנה בהצלחה' : 'החברה נוצרה בהצלחה');
        },
        error: () => this.showError(this.isEditMode() ? 'לא ניתן לעדכן חברה. אנא נסה שוב.' : 'לא ניתן ליצור חברה. אנא נסה שוב.')
      });
  }

  deleteCompany(company: CompanyDto): void {
    this.confirmationService.confirm({
      message: `האם אתה בטוח שברצונך למחוק את החברה "${company.companyName}"?`,
      header: 'מחיקת חברה',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'מחק',
      rejectLabel: 'ביטול',
      accept: () => {
        this.loading.set(true);
        this.companyService
          .deleteCompany(company.companyId)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.loadCompanies();
              this.showSuccess('החברה נמחקה בהצלחה');
            },
            error: () => this.showError('לא ניתן למחוק חברה. אנא נסה שוב.')
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.companyForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByCompanyId(index: number, company: CompanyDto): number {
    return company.companyId ?? index;
  }

  private loadCompanyDetails(id: number): void {
    this.loading.set(true);

    this.companyService
      .getCompany(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (company) => {
          this.companyForm.patchValue({
            companyName: company.companyName,
          }, { emitEvent: false });
        },
        error: () => this.showError('לא ניתן לטעון פרטי חברה.')
      });
  }

  private resetForm(): void {
    this.companyForm.reset({ companyName: '' });
    this.companyForm.markAsPristine();
    this.companyForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'הצלחה', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'שגיאה', detail: message });
  }
}
