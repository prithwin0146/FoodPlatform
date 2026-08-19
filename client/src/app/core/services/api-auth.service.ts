import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse, VerifyOtpRequest, ResendOtpRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private readonly url = `${environment.apiUrl}/auth`;

  constructor(private readonly http: HttpClient) {}

  login(req: LoginRequest, headers?: HttpHeaders): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/login`, req, { headers });
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/oauth/google`, `"${idToken}"`, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
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
