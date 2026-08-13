import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Loan } from '../models/loan';
import { CreateLoan } from '../models/create-loan';
import { ReturnLoan } from '../models/return-loan';
import { UpdateLoan } from '../models/update-loan';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.baseUrl}api/loans`);
  }

  getLoan(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.baseUrl}api/loans/${id}`);
  }

  getActiveLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.baseUrl}api/loans/active`);
  }

  getLoansByDevice(deviceId: number): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.baseUrl}api/loans/device/${deviceId}`);
  }

  createLoan(model: CreateLoan): Observable<Loan> {
    return this.http.post<Loan>(`${this.baseUrl}api/loans`, model);
  }

  updateLoan(id: number, model: UpdateLoan): Observable<Loan> {
    return this.http.put<Loan>(`${this.baseUrl}api/loans/${id}`, model);
  }

  returnLoan(id: number, model: ReturnLoan): Observable<Loan> {
    return this.http.put<Loan>(`${this.baseUrl}api/loans/${id}/return`, model);
  }

  deleteLoan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/loans/${id}`);
  }
}
