import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DepositType } from '../models/deposit-type';

@Injectable({
  providedIn: 'root'
})
export class DepositTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getDepositTypes(): Observable<DepositType[]> {
    return this.http.get<DepositType[]>(`${this.baseUrl}api/DepositTypes`);
  }
}
