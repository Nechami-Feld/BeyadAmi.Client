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
    ToastModule
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
    requestDate: ['', [Validators.required]],
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
        error: () => this.showError('Unable to load branch requests. Please try again.')
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
      requestDate: formValue.requestDate,
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
          this.showSuccess(this.isEditMode() ? 'Branch request updated successfully' : 'Branch request created successfully');
        },
        error: () => this.showError(this.isEditMode() ? 'Unable to update branch request. Please try again.' : 'Unable to create branch request. Please try again.')
      });
  }

  deleteRequest(request: BranchRequest): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this request?`,
      header: 'Delete Branch Request',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
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
              this.showSuccess('Branch request deleted successfully');
            },
            error: () => this.showError('Unable to delete branch request. Please try again.')
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
        error: () => this.showError('Unable to load branches.')
      });
  }

  private loadRequestDetails(id: number): void {
    this.loading.set(true);

    this.branchRequestService
      .getBranchRequest(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (request) => this.requestForm.patchValue(request, { emitEvent: false }),
        error: () => this.showError('Unable to load branch request details.')
      });
  }

  private resetForm(): void {
    this.requestForm.reset({
      branchId: 0,
      requestDate: '',
      isCompleted: false,
      completedDate: '',
      notes: '',
    });
    this.requestForm.markAsPristine();
    this.requestForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}
