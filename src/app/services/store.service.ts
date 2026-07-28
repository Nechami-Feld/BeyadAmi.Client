import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateStoreRequest } from '../models/create-store-request';
import { StoreDto } from '../models/store';
import { UpdateStoreRequest } from '../models/update-store-request';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getStores(): Observable<StoreDto[]> {
    return this.http.get<StoreDto[]>(`${this.baseUrl}api/stores`);
  }

  getStore(id: number): Observable<StoreDto> {
    return this.http.get<StoreDto>(`${this.baseUrl}api/stores/${id}`);
  }

  createStore(model: CreateStoreRequest): Observable<StoreDto> {
    return this.http.post<StoreDto>(`${this.baseUrl}api/stores`, model);
  }

  updateStore(id: number, model: UpdateStoreRequest): Observable<StoreDto> {
    return this.http.put<StoreDto>(`${this.baseUrl}api/stores/${id}`, model);
  }

  deleteStore(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/stores/${id}`);
  }
}
