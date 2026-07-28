import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BranchRequest } from '../models/branch-request';
import { CreateBranchRequestRequest } from '../models/create-branch-request-request';
import { UpdateBranchRequestRequest } from '../models/update-branch-request-request';

@Injectable({
  providedIn: 'root'
})
export class BranchRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getBranchRequests(): Observable<BranchRequest[]> {
    return this.http.get<BranchRequest[]>(`${this.baseUrl}api/BranchRequests`);
  }

  getBranchRequest(id: number): Observable<BranchRequest> {
    return this.http.get<BranchRequest>(`${this.baseUrl}api/BranchRequests/${id}`);
  }

  getBranchRequestsByBranch(branchId: number): Observable<BranchRequest[]> {
    return this.http.get<BranchRequest[]>(`${this.baseUrl}api/BranchRequests/branch/${branchId}`);
  }

  createBranchRequest(model: CreateBranchRequestRequest): Observable<BranchRequest> {
    return this.http.post<BranchRequest>(`${this.baseUrl}api/BranchRequests`, model);
  }

  updateBranchRequest(id: number, model: UpdateBranchRequestRequest): Observable<BranchRequest> {
    return this.http.put<BranchRequest>(`${this.baseUrl}api/BranchRequests/${id}`, model);
  }

  deleteBranchRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}api/BranchRequests/${id}`);
  }
}
