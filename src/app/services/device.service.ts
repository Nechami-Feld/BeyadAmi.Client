import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Device } from '../models/device';
import { CreateDeviceRequest } from '../models/create-device-request';
import { UpdateDeviceRequest } from '../models/update-device-request';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}api/Devices`);
  }

  getDevice(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.baseUrl}api/Devices/${id}`);
  }

  getDevicesByBranch(branchId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}api/Devices/branch/${branchId}`);
  }

  getAvailableDevices(branchId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}api/Devices/available/${branchId}`);
  }

  createDevice(model: CreateDeviceRequest): Observable<Device> {
    return this.http.post<Device>(`${this.baseUrl}api/Devices`, model);
  }

  updateDevice(id: number, model: UpdateDeviceRequest): Observable<Device> {
    return this.http.put<Device>(`${this.baseUrl}api/Devices/${id}`, model);
  }

  deleteDevice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/Devices/${id}`);
  }
}
