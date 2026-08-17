import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinner } from 'primeng/progressspinner';
import { SortIcon, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DeviceCategory } from '../../models/device-category';
import { CreateDeviceCategoryRequest } from '../../models/create-device-category-request';
import { UpdateDeviceCategoryRequest } from '../../models/update-device-category-request';
import { DeviceCategoryService } from '../../services/device-category.service';

@Component({
  selector: 'app-device-categories',
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
    InputNumberModule,
    TextareaModule,
    ToolbarModule,
    ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './device-categories.component.html',
  styleUrl: './device-categories.component.scss'
})
export class DeviceCategoriesComponent implements OnInit {
  private readonly deviceCategoryService = inject(DeviceCategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<DeviceCategory[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly searchTerm = signal('');
  readonly selectedCategoryId = signal<number | null>(null);

  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.categories()) ? this.categories() : [];

    if (!term) {
      return source;
    }

    return source.filter((category) => {
      const values = [
        category.categoryName,
        category.description,
        category.deviceTypesCount?.toString(),
      ];

      return values.some((value) => value?.toLowerCase().includes(term));
    });
  });

  readonly categoryForm: FormGroup = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required]],
    description: [''],
    deviceTypesCount: [null],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);

    this.deviceCategoryService
      .getDeviceCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(Array.isArray(categories) ? categories : []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.showError('לא ניתן לטעון את קטגוריות המכשירים. אנא נסה שוב.');
        }
      });
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedCategoryId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(category: DeviceCategory): void {
    const categoryId = category?.categoryId;

    this.isEditMode.set(true);
    this.selectedCategoryId.set(categoryId ?? null);
    this.dialogVisible.set(true);
    this.resetForm();
    this.categoryForm.patchValue(category, { emitEvent: false });

    if (categoryId !== undefined && categoryId !== null) {
      this.loadCategoryDetails(categoryId);
    } else {
      this.loading.set(false);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.categoryForm.getRawValue() as CreateDeviceCategoryRequest;
    const request: CreateDeviceCategoryRequest | UpdateDeviceCategoryRequest = {
      categoryName: formValue.categoryName,
      description: formValue.description ?? null,
      deviceTypesCount: formValue.deviceTypesCount ?? null,
    };

    const saveRequest = this.isEditMode() && this.selectedCategoryId() !== null
      ? this.deviceCategoryService.updateDeviceCategory(this.selectedCategoryId()!, request as UpdateDeviceCategoryRequest)
      : this.deviceCategoryService.createDeviceCategory(request as CreateDeviceCategoryRequest);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogVisible.set(false);
        this.resetForm();
        this.loadCategories();
        this.showSuccess(this.isEditMode() ? 'קטגוריית המכשיר עודכנה בהצלחה' : 'קטגוריית המכשיר נוצרה בהצלחה');
      },
      error: () => {
        this.loading.set(false);
        this.showError(this.isEditMode() ? 'לא ניתן לעדכן את קטגוריית המכשיר. אנא נסה שוב.' : 'לא ניתן ליצור את קטגוריית המכשיר. אנא נסה שוב.');
      }
    });
  }

  deleteCategory(category: DeviceCategory): void {
    this.confirmationService.confirm({
      message: `האם אתה בטוח שברצונך למחוק את ${category.categoryName}?`,
      header: 'מחיקת קטגוריית מכשיר',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'מחק',
      rejectLabel: 'ביטול',
      accept: () => {
        if (category.categoryId === undefined) {
          return;
        }

        this.loading.set(true);
        this.deviceCategoryService
          .deleteDeviceCategory(category.categoryId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.loading.set(false);
              this.loadCategories();
              this.showSuccess('קטגוריית המכשיר נמחקה בהצלחה');
            },
            error: () => {
              this.loading.set(false);
              this.showError('לא ניתן למחוק את קטגוריית המכשיר. אנא נסה שוב.');
            }
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.categoryForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByCategoryId(index: number, category: DeviceCategory): number | undefined {
    return category.categoryId ?? index;
  }

  private loadCategoryDetails(id: number): void {
    this.loading.set(true);

    this.deviceCategoryService
      .getDeviceCategory(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (category) => {
          this.categoryForm.patchValue(category);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.showError('לא ניתן לטעון את פרטי קטגוריית המכשיר.');
        }
      });
  }

  private resetForm(): void {
    this.categoryForm.reset({
      categoryName: '',
      description: '',
      deviceTypesCount: null,
    });
    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
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
