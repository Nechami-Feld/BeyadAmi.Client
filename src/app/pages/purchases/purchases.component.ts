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
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { PurchaseDto } from '../../models/purchase';
import { CreatePurchaseDto } from '../../models/create-purchase';
import { UpdatePurchaseDto } from '../../models/update-purchase';
import { StoreDto } from '../../models/store';
import { PurchaseService } from '../../services/purchase.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-purchases',
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
    InputNumberModule,
    TextareaModule,
    ToolbarModule,
    ToastModule,
    SelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.scss'
})
export class PurchasesComponent implements OnInit {
  private readonly purchaseService = inject(PurchaseService);
  private readonly storeService = inject(StoreService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly purchases = signal<PurchaseDto[]>([]);
  readonly stores = signal<StoreDto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedPurchaseId = signal<number | null>(null);

  readonly filteredPurchases = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.purchases()) ? this.purchases() : [];

    if (!term) {
      return source;
    }

    return source.filter((p) => {
      const values = [
        p.storeName,
        p.productName,
        p.productModel,
        p.productCompany,
        p.purchasedBy,
        p.receipt,
        p.notes,
        String(p.quantity),
        String(p.pricePerUnit),
        String(p.totalPrice),
        p.purchaseDate,
      ];
      return values.some((v) => v?.toLowerCase().includes(term));
    });
  });

  readonly purchaseForm: FormGroup = this.fb.nonNullable.group({
    storeId: [null as number | null, [Validators.required, Validators.min(1)]],
    productId: [null as number | null, [Validators.required, Validators.min(1)]],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    pricePerUnit: [null as number | null, [Validators.required, Validators.min(0)]],
    purchasedBy: [''],
    purchaseDate: [''],
    receipt: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadPurchases();
    this.loadStores();
  }

  loadPurchases(): void {
    this.loading.set(true);

    this.purchaseService
      .getPurchases()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (purchases) => this.purchases.set(Array.isArray(purchases) ? purchases : []),
        error: () => this.showError('לא ניתן לטעון רכישות. אנא נסה שוב.')
      });
  }

  private loadStores(): void {
    this.storeService
      .getStores()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stores) => this.stores.set(Array.isArray(stores) ? stores : []),
        error: () => this.showError('לא ניתן לטעון חנויות.')
      });
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedPurchaseId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(purchase: PurchaseDto): void {
    this.isEditMode.set(true);
    this.selectedPurchaseId.set(purchase.purchaseId ?? null);
    this.resetForm();
    this.dialogVisible.set(true);

    if (purchase.purchaseId !== undefined) {
      this.loadPurchaseDetails(purchase.purchaseId);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  savePurchase(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.purchaseForm.getRawValue();

    const saveRequest = this.isEditMode() && this.selectedPurchaseId() !== null
      ? this.purchaseService.updatePurchase(this.selectedPurchaseId()!, {
          storeId: formValue.storeId,
          productId: formValue.productId,
          quantity: formValue.quantity,
          pricePerUnit: formValue.pricePerUnit,
          purchasedBy: formValue.purchasedBy || null,
          receipt: formValue.receipt || null,
          notes: formValue.notes || null,
        } as UpdatePurchaseDto)
      : this.purchaseService.createPurchase({
          storeId: formValue.storeId,
          productId: formValue.productId,
          quantity: formValue.quantity,
          pricePerUnit: formValue.pricePerUnit,
          purchasedBy: formValue.purchasedBy || null,
          purchaseDate: formValue.purchaseDate || null,
          receipt: formValue.receipt || null,
          notes: formValue.notes || null,
        } as CreatePurchaseDto);

    saveRequest
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.resetForm();
          this.loadPurchases();
          this.showSuccess(this.isEditMode() ? 'הרכישה עודכנה בהצלחה' : 'הרכישה נוצרה בהצלחה');
        },
        error: () => this.showError(this.isEditMode() ? 'לא ניתן לעדכן רכישה. אנא נסה שוב.' : 'לא ניתן ליצור רכישה. אנא נסה שוב.')
      });
  }

  deletePurchase(purchase: PurchaseDto): void {
    this.confirmationService.confirm({
      message: `האם אתה בטוח שברצונך למחוק רכישה זו?`,
      header: 'מחיקת רכישה',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'מחק',
      rejectLabel: 'ביטול',
      accept: () => {
        this.loading.set(true);
        this.purchaseService
          .deletePurchase(purchase.purchaseId)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.loadPurchases();
              this.showSuccess('הרכישה נמחקה בהצלחה');
            },
            error: () => this.showError('לא ניתן למחוק רכישה. אנא נסה שוב.')
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.purchaseForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByPurchaseId(index: number, purchase: PurchaseDto): number {
    return purchase.purchaseId ?? index;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('he-IL');
  }

  private loadPurchaseDetails(id: number): void {
    this.loading.set(true);

    this.purchaseService
      .getPurchase(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (purchase) => {
          this.purchaseForm.patchValue({
            storeId: purchase.storeId,
            productId: purchase.productId,
            quantity: purchase.quantity,
            pricePerUnit: purchase.pricePerUnit,
            purchasedBy: purchase.purchasedBy ?? '',
            receipt: purchase.receipt ?? '',
            notes: purchase.notes ?? '',
          }, { emitEvent: false });
        },
        error: () => this.showError('לא ניתן לטעון פרטי רכישה.')
      });
  }

  private resetForm(): void {
    this.purchaseForm.reset({
      storeId: null,
      productId: null,
      quantity: null,
      pricePerUnit: null,
      purchasedBy: '',
      purchaseDate: '',
      receipt: '',
      notes: '',
    });
    this.purchaseForm.markAsPristine();
    this.purchaseForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'הצלחה', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'שגיאה', detail: message });
  }
}
