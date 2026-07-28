import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  get<T>(url:string){
    return this.http.get<T>(
      this.baseUrl + url
    );
  }

}