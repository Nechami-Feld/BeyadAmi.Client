import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Branch } from '../models/branch';
import { CreateBranchRequest } from '../models/create-branch-request';
import { UpdateBranchRequest } from '../models/update-branch-request';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.baseUrl}api/branches`);
  }

  getBranch(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.baseUrl}api/branches/${id}`);
  }

  createBranch(model: CreateBranchRequest): Observable<Branch> {
    return this.http.post<Branch>(`${this.baseUrl}api/branches`, model);
  }

  updateBranch(id: number, model: UpdateBranchRequest): Observable<Branch> {
    return this.http.put<Branch>(`${this.baseUrl}api/branches/${id}`, model);
  }

  deleteBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/branches/${id}`);
  }
}
