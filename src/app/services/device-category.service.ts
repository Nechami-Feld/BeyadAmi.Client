import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeviceCategory } from '../models/device-category';
import { CreateDeviceCategoryRequest } from '../models/create-device-category-request';
import { UpdateDeviceCategoryRequest } from '../models/update-device-category-request';

@Injectable({
  providedIn: 'root'
})
export class DeviceCategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getDeviceCategories(): Observable<DeviceCategory[]> {
    return this.http.get<DeviceCategory[]>(`${this.baseUrl}api/DeviceCategories`);
  }

  getDeviceCategory(id: number): Observable<DeviceCategory> {
    return this.http.get<DeviceCategory>(`${this.baseUrl}api/DeviceCategories/${id}`);
  }

  createDeviceCategory(model: CreateDeviceCategoryRequest): Observable<DeviceCategory> {
    return this.http.post<DeviceCategory>(`${this.baseUrl}api/DeviceCategories`, model);
  }

  updateDeviceCategory(id: number, model: UpdateDeviceCategoryRequest): Observable<DeviceCategory> {
    return this.http.put<DeviceCategory>(`${this.baseUrl}api/DeviceCategories/${id}`, model);
  }

  deleteDeviceCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/DeviceCategories/${id}`);
  }
}
