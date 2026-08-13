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
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CompanyDto } from '../../models/company';
import { ProductDto } from '../../models/product';
import { CreateProductDto } from '../../models/create-product';
import { UpdateProductDto } from '../../models/update-product';
import { CompanyService } from '../../services/company.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products',
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
    SelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly companyService = inject(CompanyService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = signal<ProductDto[]>([]);
  readonly companies = signal<CompanyDto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedProductId = signal<number | null>(null);

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.products()) ? this.products() : [];

    if (!term) {
      return source;
    }

    return source.filter((p) => {
      const values = [
        p.productName,
        p.model,
        p.company,
        p.notes,
        String(p.purchasesCount),
      ];
      return values.some((v) => v?.toLowerCase().includes(term));
    });
  });

  readonly productForm: FormGroup = this.fb.nonNullable.group({
    productName: ['', [Validators.required]],
    model: [''],
    companyId: [null],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.companyService
      .getCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (companies) => this.companies.set(companies) });
  }

  loadProducts(): void {
    this.loading.set(true);

    this.productService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (products) => this.products.set(Array.isArray(products) ? products : []),
        error: () => this.showError('לא ניתן לטעון מוצרים. אנא נסה שוב.')
      });
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedProductId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(product: ProductDto): void {
    this.isEditMode.set(true);
    this.selectedProductId.set(product.productId ?? null);
    this.resetForm();
    this.dialogVisible.set(true);

    if (product.productId !== undefined) {
      this.loadProductDetails(product.productId);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.productForm.getRawValue();

    const selectedCompany = this.companies().find(c => c.companyId === formValue.companyId);
    const companyName = selectedCompany?.companyName || null;

    const saveRequest = this.isEditMode() && this.selectedProductId() !== null
      ? this.productService.updateProduct(this.selectedProductId()!, {
          productName: formValue.productName,
          model: formValue.model || null,
          company: companyName,
          notes: formValue.notes || null,
        } as UpdateProductDto)
      : this.productService.createProduct({
          productName: formValue.productName,
          model: formValue.model || null,
          company: companyName,
          notes: formValue.notes || null,
        } as CreateProductDto);

    saveRequest
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.resetForm();
          this.loadProducts();
          this.showSuccess(this.isEditMode() ? 'המוצר עודכן בהצלחה' : 'המוצר נוצר בהצלחה');
        },
        error: () => this.showError(this.isEditMode() ? 'לא ניתן לעדכן מוצר. אנא נסה שוב.' : 'לא ניתן ליצור מוצר. אנא נסה שוב.')
      });
  }

  deleteProduct(product: ProductDto): void {
    this.confirmationService.confirm({
      message: `האם אתה בטוח שברצונך למחוק את המוצר "${product.productName}"?`,
      header: 'מחיקת מוצר',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'מחק',
      rejectLabel: 'ביטול',
      accept: () => {
        this.loading.set(true);
        this.productService
          .deleteProduct(product.productId)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.loadProducts();
              this.showSuccess('המוצר נמחק בהצלחה');
            },
            error: () => this.showError('לא ניתן למחוק מוצר. אנא נסה שוב.')
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByProductId(index: number, product: ProductDto): number {
    return product.productId ?? index;
  }

  private loadProductDetails(id: number): void {
    this.loading.set(true);

    this.productService
      .getProduct(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (product) => {
          const matchedCompany = this.companies().find(c => c.companyName === product.company);
          this.productForm.patchValue({
            productName: product.productName,
            model: product.model ?? '',
            companyId: matchedCompany?.companyId ?? null,
            notes: product.notes ?? '',
          }, { emitEvent: false });
        },
        error: () => this.showError('לא ניתן לטעון פרטי מוצר.')
      });
  }

  private resetForm(): void {
    this.productForm.reset({
      productName: '',
      model: '',
      companyId: null,
      notes: '',
    });
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'הצלחה', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'שגיאה', detail: message });
  }
}
