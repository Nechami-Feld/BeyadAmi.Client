import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductDto } from '../models/product';
import { CreateProductDto } from '../models/create-product';
import { UpdateProductDto } from '../models/update-product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getProducts(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.baseUrl}api/products`);
  }

  getProduct(id: number): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.baseUrl}api/products/${id}`);
  }

  createProduct(model: CreateProductDto): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.baseUrl}api/products`, model);
  }

  updateProduct(id: number, model: UpdateProductDto): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.baseUrl}api/products/${id}`, model);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/products/${id}`);
  }
}
