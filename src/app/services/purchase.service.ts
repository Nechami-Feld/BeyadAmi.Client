import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PurchaseDto } from '../models/purchase';
import { CreatePurchaseDto } from '../models/create-purchase';
import { UpdatePurchaseDto } from '../models/update-purchase';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getPurchases(): Observable<PurchaseDto[]> {
    return this.http.get<PurchaseDto[]>(`${this.baseUrl}api/purchases`);
  }

  getPurchase(id: number): Observable<PurchaseDto> {
    return this.http.get<PurchaseDto>(`${this.baseUrl}api/purchases/${id}`);
  }

  getPurchasesByStore(storeId: number): Observable<PurchaseDto[]> {
    return this.http.get<PurchaseDto[]>(`${this.baseUrl}api/purchases/store/${storeId}`);
  }

  getPurchasesByProduct(productId: number): Observable<PurchaseDto[]> {
    return this.http.get<PurchaseDto[]>(`${this.baseUrl}api/purchases/product/${productId}`);
  }

  createPurchase(model: CreatePurchaseDto): Observable<PurchaseDto> {
    return this.http.post<PurchaseDto>(`${this.baseUrl}api/purchases`, model);
  }

  updatePurchase(id: number, model: UpdatePurchaseDto): Observable<PurchaseDto> {
    return this.http.put<PurchaseDto>(`${this.baseUrl}api/purchases/${id}`, model);
  }

  deletePurchase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/purchases/${id}`);
  }
}
