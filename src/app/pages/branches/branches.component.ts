import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinner } from 'primeng/progressspinner';
import { SortIcon, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Branch } from '../../models/branch';
import { CreateBranchRequest } from '../../models/create-branch-request';
import { UpdateBranchRequest } from '../../models/update-branch-request';
import { BranchService } from '../../services/branch.service';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SortIcon,
    ConfirmDialog,
    ProgressSpinner,
    InputTextModule,
    TextareaModule,
    ToolbarModule,
    ToastModule,
    ToggleSwitchModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.scss'
})
export class BranchesComponent implements OnInit {
  private readonly branchService = inject(BranchService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly branches = signal<Branch[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly searchTerm = signal('');
  readonly selectedBranchId = signal<number | null>(null);

  readonly filteredBranches = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.branches()) ? this.branches() : [];

    if (!term) {
      return source;
    }

    return source.filter((branch) => {
      const values = [
        branch.branchName,
        branch.city,
        branch.street,
        branch.apartment,
        branch.phone,
        branch.email,
        branch.notes,
        branch.isActive ? 'active' : 'inactive',
      ];

      return values.some((value) => value?.toLowerCase().includes(term));
    });
  });

  readonly branchForm: FormGroup = this.fb.nonNullable.group({
    branchName: ['', [Validators.required]],
    city: [''],
    street: [''],
    apartment: [''],
    phone: [''],
    email: ['', [Validators.email]],
    notes: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading.set(true);

    this.branchService
      .getBranches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (branches) => {
          this.branches.set(Array.isArray(branches) ? branches : []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.showError('לא ניתן לטעון סניפים. אנא נסה שוב.');
        }
      });
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedBranchId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(branch: Branch): void {
    const branchId = branch?.branchId;

    this.isEditMode.set(true);
    this.selectedBranchId.set(branchId ?? null);
    this.dialogVisible.set(true);
    this.resetForm();
    this.branchForm.patchValue(branch, { emitEvent: false });

    if (branchId !== undefined && branchId !== null) {
      this.loadBranchDetails(branchId);
    } else {
      this.loading.set(false);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.branchForm.getRawValue() as CreateBranchRequest;
    const request: CreateBranchRequest | UpdateBranchRequest = {
      branchName: formValue.branchName,
      city: formValue.city ?? null,
      street: formValue.street ?? null,
      apartment: formValue.apartment ?? null,
      phone: formValue.phone ?? null,
      email: formValue.email ?? null,
      notes: formValue.notes ?? null,
      isActive: formValue.isActive,
    };

    const saveRequest = this.isEditMode() && this.selectedBranchId() !== null
      ? this.branchService.updateBranch(this.selectedBranchId()!, request as UpdateBranchRequest)
      : this.branchService.createBranch(request as CreateBranchRequest);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogVisible.set(false);
        this.resetForm();
        this.loadBranches();
        this.showSuccess(this.isEditMode() ? 'הסניף עודכן בהצלחה' : 'הסניף נוצר בהצלחה');
      },
      error: () => {
        this.loading.set(false);
        this.showError(this.isEditMode() ? 'לא ניתן לעדכן את הסניף. אנא נסה שוב.' : 'לא ניתן ליצור את הסניף. אנא נסה שוב.');
      }
    });
  }

  toggleBranchActive(branch: Branch): void {
    const updated: UpdateBranchRequest = {
      branchName: branch.branchName,
      city: branch.city ?? null,
      street: branch.street ?? null,
      apartment: branch.apartment ?? null,
      phone: branch.phone ?? null,
      email: branch.email ?? null,
      notes: branch.notes ?? null,
      isActive: !branch.isActive,
    };

    this.branchService
      .updateBranch(branch.branchId!, updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.branches.update(list => list.map(b => b.branchId === branch.branchId ? { ...b, isActive: !branch.isActive } : b));
          this.showSuccess('הסטטוס עודכן בהצלחה');
        },
        error: () => this.showError('לא ניתן לעדכן סטטוס. אנא נסה שוב.')
      });
  }

  deleteBranch(branch: Branch): void {
    this.confirmationService.confirm({
      message: `האם אתה בטוח שברצונך למחוק את ${branch.branchName}?`,
      header: 'מחיקת סניף',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'מחק',
      rejectLabel: 'ביטול',
      accept: () => {
        if (branch.branchId === undefined) {
          return;
        }

        this.loading.set(true);
        this.branchService
          .deleteBranch(branch.branchId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.loading.set(false);
              this.loadBranches();
              this.showSuccess('הסניף נמחק בהצלחה');
            },
            error: () => {
              this.loading.set(false);
              this.showError('לא ניתן למחוק את הסניף. אנא נסה שוב.');
            }
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.branchForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByBranchId(index: number, branch: Branch): number | undefined {
    return branch.branchId ?? index;
  }

  private loadBranchDetails(id: number): void {
    this.loading.set(true);

    this.branchService
      .getBranch(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (branch) => {
          this.branchForm.patchValue(branch);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.showError('לא ניתן לטעון פרטי הסניף.');
        }
      });
  }

  private resetForm(): void {
    this.branchForm.reset({
      branchName: '',
      city: '',
      street: '',
      apartment: '',
      phone: '',
      email: '',
      notes: '',
      isActive: true,
    });
    this.branchForm.markAsPristine();
    this.branchForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'הצלחה',
      detail: message
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'שגיאה',
      detail: message
    });
  }
}
