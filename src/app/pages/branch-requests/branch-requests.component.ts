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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { BranchRequest } from '../../models/branch-request';
import { Branch } from '../../models/branch';
import { CreateBranchRequestRequest } from '../../models/create-branch-request-request';
import { UpdateBranchRequestRequest } from '../../models/update-branch-request-request';
import { BranchRequestService } from '../../services/branch-request.service';
import { BranchService } from '../../services/branch.service';

@Component({
  selector: 'app-branch-requests',
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
    ToastModule,
    ToggleSwitchModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './branch-requests.component.html',
  styleUrl: './branch-requests.component.scss'
})
export class BranchRequestsComponent implements OnInit {
  private readonly branchRequestService = inject(BranchRequestService);
  private readonly branchService = inject(BranchService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly requests = signal<BranchRequest[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly searchTerm = signal('');
  readonly selectedRequestId = signal<number | null>(null);
  readonly filterBranchId = signal<number | null>(null);

  readonly filteredRequests = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.requests()) ? this.requests() : [];

    if (!term) {
      return source;
    }

    return source.filter((req) => {
      const values = [
        req.branchName,
        req.request,
        req.requestDate,
        req.completedDate,
        req.notes,
        req.isCompleted ? 'yes' : 'no',
      ];

      return values.some((value) => value?.toLowerCase().includes(term));
    });
  });

  readonly requestForm: FormGroup = this.fb.nonNullable.group({
    branchId: [0, [Validators.required, Validators.min(1)]],
    request: ['', [Validators.required]],
    isCompleted: [false],
    completedDate: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadRequests();
    this.loadBranches();
  }

  loadRequests(): void {
    this.loading.set(true);
    const branchId = this.filterBranchId();

    const source$ = branchId !== null
      ? this.branchRequestService.getBranchRequestsByBranch(branchId)
      : this.branchRequestService.getBranchRequests();

    source$
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (requests) => this.requests.set(Array.isArray(requests) ? requests : []),
        error: () => this.showError('לא ניתן לטעון את הבקשות. אנא נסה שוב.')
      });
  }

  filterByBranch(branchId: number | null): void {
    this.filterBranchId.set(branchId);
    this.loadRequests();
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedRequestId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(request: BranchRequest): void {
    this.isEditMode.set(true);
    this.selectedRequestId.set(request.requestId ?? null);
    this.resetForm();
    this.dialogVisible.set(true);
    this.requestForm.patchValue(request, { emitEvent: false });

    if (request.requestId !== undefined) {
      this.loadRequestDetails(request.requestId);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  saveRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.requestForm.getRawValue();
    const isCompleted: boolean = !!formValue.isCompleted;
    const request: CreateBranchRequestRequest | UpdateBranchRequestRequest = {
      branchId: Number(formValue.branchId),
      request: formValue.request,
      isCompleted,
      completedDate: isCompleted ? (formValue.completedDate || null) : null,
      notes: formValue.notes || null,
    };

    const saveRequest$ = this.isEditMode() && this.selectedRequestId() !== null
      ? this.branchRequestService.updateBranchRequest(this.selectedRequestId()!, request as UpdateBranchRequestRequest)
      : this.branchRequestService.createBranchRequest(request as CreateBranchRequestRequest);

    saveRequest$
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.resetForm();
          this.loadRequests();
          this.showSuccess(this.isEditMode() ? 'הבקשה עודכנה בהצלחה' : 'הבקשה נוצרה בהצלחה');
        },
        error: () => this.showError(this.isEditMode() ? 'לא ניתן לעדכן את הבקשה. אנא נסה שוב.' : 'לא ניתן ליצור את הבקשה. אנא נסה שוב.')
      });
  }

  toggleRequestCompleted(request: BranchRequest): void {
    const updated: UpdateBranchRequestRequest = {
      branchId: request.branchId,
      request: request.request,
      requestDate: request.requestDate,
      isCompleted: !request.isCompleted,
      completedDate: !request.isCompleted ? (request.completedDate ?? null) : null,
      notes: request.notes ?? null,
    };

    this.branchRequestService
      .updateBranchRequest(request.requestId!, updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requests.update(list => list.map(r => r.requestId === request.requestId ? { ...r, isCompleted: !request.isCompleted } : r));
          this.loadRequests();
          this.showSuccess('הסטטוס עודכן בהצלחה');
        },
        error: () => this.showError('לא ניתן לעדכן סטטוס. אנא נסה שוב.')
      });
  }

  deleteRequest(request: BranchRequest): void {
    this.confirmationService.confirm({
      message: `האם אתה בטוח שברצונך למחוק בקשה זו?`,
      header: 'מחיקת בקשה',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'מחק',
      rejectLabel: 'ביטול',
      accept: () => {
        if (request.requestId === undefined) {
          return;
        }

        this.loading.set(true);
        this.branchRequestService
          .deleteBranchRequest(request.requestId)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.loadRequests();
              this.showSuccess('הבקשה נמחקה בהצלחה');
            },
            error: () => this.showError('לא ניתן למחוק את הבקשה. אנא נסה שוב.')
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.requestForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByRequestId(index: number, request: BranchRequest): number {
    return request.requestId ?? index;
  }

  private loadBranches(): void {
    this.branchService
      .getBranches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (branches) => this.branches.set(Array.isArray(branches) ? branches : []),
        error: () => this.showError('לא ניתן לטעון סניפים.')
      });
  }

  private loadRequestDetails(id: number): void {
    this.loading.set(true);

    this.branchRequestService
      .getBranchRequest(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (request) => this.requestForm.patchValue(request, { emitEvent: false }),
        error: () => this.showError('לא ניתן לטעון פרטי הבקשה.')
      });
  }

  private resetForm(): void {
    this.requestForm.reset({
      branchId: 0,
      request: '',
      requestDate: '',
      isCompleted: false,
      completedDate: '',
      notes: '',
    });
    this.requestForm.markAsPristine();
    this.requestForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'הצלחה', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'שגיאה', detail: message });
  }
}
