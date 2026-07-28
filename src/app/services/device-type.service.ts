import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeviceCategory } from '../models/device-category';

@Injectable({
  providedIn: 'root'
})
export class DeviceTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getDeviceTypes(): Observable<DeviceCategory[]> {
    return this.http.get<DeviceCategory[]>(`${this.baseUrl}api/DeviceCategories`);
  }
}
