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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CreateStoreRequest } from '../../models/create-store-request';
import { StoreDto } from '../../models/store';
import { UpdateStoreRequest } from '../../models/update-store-request';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-stores',
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
    ToggleSwitchModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.scss'
})
export class StoresComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stores = signal<StoreDto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedStoreId = signal<number | null>(null);

  readonly filteredStores = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.stores()) ? this.stores() : [];

    if (!term) {
      return source;
    }

    return source.filter((store) => {
      const values = [
        store.storeName,
        store.address,
        store.phone,
        store.notes,
      ];

      return values.some((value) => value?.toLowerCase().includes(term));
    });
  });

  readonly storeForm: FormGroup = this.fb.nonNullable.group({
    storeName: ['', [Validators.required]],
    address: ['', [Validators.required]],
    phone: [''],
    email: [''],
    notes: [''],
    productsCount: [0, [Validators.required, Validators.min(0)]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.loading.set(true);

    this.storeService
      .getStores()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stores) => this.stores.set(Array.isArray(stores) ? stores : []),
        error: () => this.showError('לא ניתן לטעון חנויות. אנא נסה שוב.')
      });
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedStoreId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(store: StoreDto): void {
    this.isEditMode.set(true);
    this.selectedStoreId.set(store.storeId ?? null);
    this.resetForm();
    this.dialogVisible.set(true);
    this.storeForm.patchValue(store, { emitEvent: false });

    if (store.storeId !== undefined) {
      this.loadStoreDetails(store.storeId);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  saveStore(): void {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.storeForm.getRawValue() as CreateStoreRequest;
    const request: CreateStoreRequest | UpdateStoreRequest = {
      storeName: formValue.storeName,
      address: formValue.address,
      phone: formValue.phone ?? '',
      email: formValue.email ?? null,
      notes: formValue.notes ?? '',
      productsCount: Number(formValue.productsCount ?? 0),
      isActive: formValue.isActive ?? true
    };

    const saveRequest = this.isEditMode() && this.selectedStoreId() !== null
      ? this.storeService.updateStore(this.selectedStoreId()!, request as UpdateStoreRequest)
      : this.storeService.createStore(request as CreateStoreRequest);

    saveRequest
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.resetForm();
          this.loadStores();
          this.showSuccess(this.isEditMode() ? 'החנות עודכנה בהצלחה' : 'החנות נוצרה בהצלחה');
        },
        error: () => this.showError(this.isEditMode() ? 'לא ניתן לעדכן את החנות. אנא נסה שוב.' : 'לא ניתן ליצור את החנות. אנא נסה שוב.')
      });
  }

  toggleStoreActive(store: StoreDto): void {
    const updated: UpdateStoreRequest = {
      storeName: store.storeName,
      address: store.address,
      phone: store.phone,
      email: store.email ?? null,
      notes: store.notes,
      productsCount: 0,
      isActive: !store.isActive,
    };

    this.storeService
      .updateStore(store.storeId, updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.stores.update(list => list.map(s => s.storeId === store.storeId ? { ...s, isActive: !store.isActive } : s));
          this.showSuccess('הסטטוס עודכן בהצלחה');
        },
        error: () => this.showError('לא ניתן לעדכן סטטוס. אנא נסה שוב.')
      });
  }

  deleteStore(store: StoreDto): void {
    this.confirmationService.confirm({
      message: `האם אתה בטוח שברצונך למחוק את ${store.storeName}?`,
      header: 'מחיקת חנות',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'מחק',
      rejectLabel: 'ביטול',
      accept: () => {
        if (store.storeId === undefined) {
          return;
        }

        this.loading.set(true);
        this.storeService
          .deleteStore(store.storeId)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.loadStores();
              this.showSuccess('החנות נמחקה בהצלחה');
            },
            error: () => this.showError('לא ניתן למחוק את החנות. אנא נסה שוב.')
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.storeForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByStoreId(index: number, store: StoreDto): number {
    return store.storeId ?? index;
  }

  private loadStoreDetails(id: number): void {
    this.loading.set(true);

    this.storeService
      .getStore(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (store) => this.storeForm.patchValue(store, { emitEvent: false }),
        error: () => this.showError('לא ניתן לטעון פרטי החנות.')
      });
  }

  private resetForm(): void {
    this.storeForm.reset({
      storeName: '',
      address: '',
      phone: '',
      email: '',
      notes: '',
      productsCount: 0
    });
    this.storeForm.markAsPristine();
    this.storeForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'הצלחה', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'שגיאה', detail: message });
  }
}
