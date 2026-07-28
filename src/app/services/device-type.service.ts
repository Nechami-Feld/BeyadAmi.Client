import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeviceType } from '../models/device-type';

@Injectable({
  providedIn: 'root'
})
export class DeviceTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getDeviceTypes(): Observable<DeviceType[]> {
    return this.http.get<DeviceType[]>(`${this.baseUrl}api/DeviceTypes`);
  }
}
