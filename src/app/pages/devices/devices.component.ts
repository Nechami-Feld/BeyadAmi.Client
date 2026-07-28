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
import { Device } from '../../models/device';
import { Branch } from '../../models/branch';
import { DeviceCategory } from '../../models/device-category';
import { CreateDeviceRequest } from '../../models/create-device-request';
import { UpdateDeviceRequest } from '../../models/update-device-request';
import { DeviceService } from '../../services/device.service';
import { BranchService } from '../../services/branch.service';
import { DeviceTypeService } from '../../services/device-type.service';

@Component({
  selector: 'app-devices',
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
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.scss'
})
export class DevicesComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly branchService = inject(BranchService);
  private readonly deviceTypeService = inject(DeviceTypeService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly devices = signal<Device[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly deviceTypes = signal<DeviceCategory[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dialogVisible = signal(false);
  readonly isEditMode = signal(false);
  readonly searchTerm = signal('');
  readonly selectedDeviceId = signal<number | null>(null);
  readonly filterBranchId = signal<number | null>(null);
  readonly filterAvailableOnly = signal(false);

  readonly filteredDevices = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const source = Array.isArray(this.devices()) ? this.devices() : [];

    if (!term) {
      return source;
    }

    return source.filter((device) => {
      const values = [
        device.deviceNumber,
        device.categoryName,
        device.branchName,
        device.company,
        device.notes,
        device.isAvailable ? 'yes' : 'no',
      ];

      return values.some((value) => value?.toLowerCase().includes(term));
    });
  });

  readonly deviceForm: FormGroup = this.fb.nonNullable.group({
    deviceNumber: [''],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    branchId: [0, [Validators.required, Validators.min(1)]],
    company: [''],
    isAvailable: [true],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadDevices();
    this.loadBranches();
    this.loadDeviceTypes();
  }

  loadDevices(): void {
    this.loading.set(true);
    const branchId = this.filterBranchId();
    const availableOnly = this.filterAvailableOnly();

    const source$ = branchId !== null
      ? availableOnly
        ? this.deviceService.getAvailableDevices(branchId)
        : this.deviceService.getDevicesByBranch(branchId)
      : this.deviceService.getDevices();

    source$
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (devices) => this.devices.set(Array.isArray(devices) ? devices : []),
        error: () => this.showError('Unable to load devices. Please try again.')
      });
  }

  filterByBranch(branchId: number | null): void {
    this.filterBranchId.set(branchId);
    this.filterAvailableOnly.set(false);
    this.loadDevices();
  }

  onAvailableToggle(checked: boolean): void {
    this.filterAvailableOnly.set(checked);
    this.loadDevices();
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedDeviceId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEditDialog(device: Device): void {
    this.isEditMode.set(true);
    this.selectedDeviceId.set(device.deviceId ?? null);
    this.resetForm();
    this.dialogVisible.set(true);
    this.deviceForm.patchValue(device, { emitEvent: false });

    if (device.deviceId !== undefined) {
      this.loadDeviceDetails(device.deviceId);
    }
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.resetForm();
  }

  saveDevice(): void {
    if (this.deviceForm.invalid) {
      this.deviceForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.deviceForm.getRawValue();
    const request: CreateDeviceRequest | UpdateDeviceRequest = {
      deviceNumber: formValue.deviceNumber || null,
      categoryId: Number(formValue.categoryId),
      branchId: Number(formValue.branchId),
      company: formValue.company || null,
      isAvailable: !!formValue.isAvailable,
      notes: formValue.notes || null,
    };

    const save$ = this.isEditMode() && this.selectedDeviceId() !== null
      ? this.deviceService.updateDevice(this.selectedDeviceId()!, request as UpdateDeviceRequest)
      : this.deviceService.createDevice(request as CreateDeviceRequest);

    save$
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.resetForm();
          this.loadDevices();
          this.showSuccess(this.isEditMode() ? 'Device updated successfully' : 'Device created successfully');
        },
        error: () => this.showError(this.isEditMode() ? 'Unable to update device. Please try again.' : 'Unable to create device. Please try again.')
      });
  }

  deleteDevice(device: Device): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete device ${device.deviceNumber ?? device.deviceId}?`,
      header: 'Delete Device',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => {
        if (device.deviceId === undefined) {
          return;
        }

        this.loading.set(true);
        this.deviceService
          .deleteDevice(device.deviceId)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.loadDevices();
              this.showSuccess('Device deleted successfully');
            },
            error: () => this.showError('Unable to delete device. Please try again.')
          });
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.deviceForm.get(controlName);
    return !!control && control.hasError(errorName) && (control.dirty || control.touched);
  }

  trackByDeviceId(index: number, device: Device): number {
    return device.deviceId ?? index;
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

  private loadDeviceTypes(): void {
    this.deviceTypeService
      .getDeviceTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types) => this.deviceTypes.set(Array.isArray(types) ? types : []),
        error: () => this.showError('Unable to load device types.')
      });
  }

  private loadDeviceDetails(id: number): void {
    this.loading.set(true);

    this.deviceService
      .getDevice(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (device) => this.deviceForm.patchValue(device, { emitEvent: false }),
        error: () => this.showError('Unable to load device details.')
      });
  }

  private resetForm(): void {
    this.deviceForm.reset({
      deviceNumber: '',
      categoryId: 0,
      branchId: 0,
      company: '',
      isAvailable: true,
      notes: '',
    });
    this.deviceForm.markAsPristine();
    this.deviceForm.markAsUntouched();
  }

  private showSuccess(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}
