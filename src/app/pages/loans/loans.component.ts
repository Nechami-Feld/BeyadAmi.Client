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
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Loan } from '../../models/loan';
import { CreateLoan } from '../../models/create-loan';
import { ReturnLoan } from '../../models/return-loan';
import { DeviceCategory } from '../../models/device-category';
import { Device } from '../../models/device';
import { LoanService } from '../../services/loan.service';
import { DepositTypeService } from '../../services/deposit-type.service';
import { DeviceService } from '../../services/device.service';
import { DepositType } from '../../models/deposit-type';

@Component({
  selector: 'app-loans',
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
    TextareaModule,
    ToolbarModule,
    ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss'
})
export class LoansComponent implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly deviceService = inject(DeviceService);
  private readonly depositTypeService = inject(DepositTypeService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loans = signal<Loan[]>([]);
  readonly devices = signal<Device[]>([]);
  readonly depositTypes = signal<DepositType[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly returnDialogVisible = signal(false);
  readonly showActiveOnly = signal(false);
  readonly searchTerm = signal('');
  readonly selectedLoanId = signal<number | null>(null);

  readonly filteredLoans = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.loans()) ? this.loans() : [];

    if (!term) {
      return source;
    }

    return source.filter((loan) => {
      const values = [
        loan.deviceNumber,
        loan.categoryName,
        loan.branchName,
        loan.borrowerLastName,
        loan.phone,
        loan.depositTypeName,
        loan.notes,
        loan.isActive ? 'active' : 'returned',
      ];

      return values.some((value) => value?.toLowerCase().includes(term));
    });
  });

  readonly loanForm: FormGroup = this.fb.nonNullable.group({
    deviceId: [0, [Validators.required, Validators.min(1)]],
    borrowerLastName: [''],
    address: [''],
    phone: [''],
    depositTypeId: [0, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  readonly returnForm: FormGroup = this.fb.nonNullable.group({
    returnDate: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadLoans();
    this.loadDevices();
    this.loadDepositTypes();
  }

  loadLoans(): void {
    this.loading.set(true);

    const source$ = this.showActiveOnly()
      ? this.loanService.getActiveLoans()
      : this.loanService.getLoans();

    source$
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (loans) => this.loans.set(Array.isArray(loans) ? loans : []),
        error: () => this.showError('Unable to load loans. Please try again.')
      });
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.set(!this.showActiveOnly());
    this.loadLoans();
  }

  openCreateDialog(): void {
    this.resetLoanForm();
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetLoanForm();
  }

  saveLoan(): void {
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.loanForm.getRawValue();
    const request: CreateLoan = {
      deviceId: Number(formValue.deviceId),
      borrowerLastName: formValue.borrowerLastName || null,
      address: formValue.address || null,
      phone: formValue.phone || null,
      depositTypeId: Number(formValue.depositTypeId),
      notes: formValue.notes || null,
    };

    this.loanService
      .createLoan(request)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.resetLoanForm();
          this.loadLoans();
          this.showSuccess('Loan created successfully');
        },
        error: () => this.showError('Unable to create loan. Please try again.')
      });
  }

  openReturnDialog(loan: Loan): void {
    this.selectedLoanId.set(loan.loanId ?? null);
    this.resetReturnForm();
    this.returnDialogVisible.set(true);
  }

  closeReturnDialog(): void {
    this.returnDialogVisible.set(false);
    this.resetReturnForm();
  }

  returnLoan(): void {
    if (this.selectedLoanId() === null) {
      return;
    }

    this.saving.set(true);
    const formValue = this.returnForm.getRawValue();
    const request: ReturnLoan = {
      returnDate: formValue.returnDate || null,
      notes: formValue.notes || null,
    };

    this.loanService
      .returnLoan(this.selectedLoanId()!, request)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.returnDialogVisible.set(false);
          this.resetReturnForm();
          this.loadLoans();
          this.showSuccess('Loan returned successfully');
        },
        error: () => this.showError('Unable to return loan. Please try again.')
      });
  }

  deleteLoan(loan: Loan): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this loan?`,
      header: 'Delete Loan',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => {
        if (loan.loanId === undefined) {
          return;
        }

        this.loading.set(true);
        this.loanService
          .deleteLoan(loan.loanId)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.loadLoans();
              this.showSuccess('Loan deleted successfully');
            },
            error: () => this.showError('Unable to delete loan. Please try again.')
          });
      }
    });
  }

  hasError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByLoanId(index: number, loan: Loan): number {
    return loan.loanId ?? index;
  }

  private loadDevices(): void {
    this.deviceService
      .getDevices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (devices) => this.devices.set(Array.isArray(devices) ? devices : []),
        error: () => this.showError('Unable to load devices.')
      });
  }

  private loadDepositTypes(): void {
    this.depositTypeService
      .getDepositTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types) => this.depositTypes.set(Array.isArray(types) ? types : []),
        error: () => this.showError('Unable to load deposit types.')
      });
  }

  private resetLoanForm(): void {
    this.loanForm.reset({
      deviceId: 0,
      borrowerLastName: '',
      address: '',
      phone: '',
      depositTypeId: 0,
      notes: '',
    });
    this.loanForm.markAsPristine();
    this.loanForm.markAsUntouched();
  }

  private resetReturnForm(): void {
    this.returnForm.reset({
      returnDate: '',
      notes: '',
    });
    this.returnForm.markAsPristine();
    this.returnForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}
