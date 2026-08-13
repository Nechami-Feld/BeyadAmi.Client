import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CompanyDto } from '../models/company';
import { CreateCompanyDto } from '../models/create-company';
import { UpdateCompanyDto } from '../models/update-company';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getCompanies(): Observable<CompanyDto[]> {
    return this.http.get<CompanyDto[]>(`${this.baseUrl}api/Companies`);
  }

  getCompany(id: number): Observable<CompanyDto> {
    return this.http.get<CompanyDto>(`${this.baseUrl}api/Companies/${id}`);
  }

  createCompany(model: CreateCompanyDto): Observable<CompanyDto> {
    return this.http.post<CompanyDto>(`${this.baseUrl}api/Companies`, model);
  }

  updateCompany(id: number, model: UpdateCompanyDto): Observable<CompanyDto> {
    return this.http.put<CompanyDto>(`${this.baseUrl}api/Companies/${id}`, model);
  }

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/Companies/${id}`);
  }
}
