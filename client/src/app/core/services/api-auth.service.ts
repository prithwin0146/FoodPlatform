import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse, VerifyOtpRequest, ResendOtpRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private readonly url = `${environment.apiUrl}/auth`;

  constructor(private readonly http: HttpClient) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/login`, req);
  }

  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.url}/register`, req);
  }

  verifyOtp(req: VerifyOtpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/verify-otp`, req);
  }

  resendOtp(req: ResendOtpRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/resend-otp`, req);
  }

  forgotPassword(req: { email: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/forgot-password`, req);
  }

  resetPassword(req: { email: string; otp: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/reset-password`, req);
  }

  changePassword(req: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.url}/change-password`, req);
  }
}
