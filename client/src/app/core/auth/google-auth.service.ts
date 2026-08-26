import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models';
import { ToastService } from '../services/toast.service';
import { jwtDecode } from 'jwt-decode';

// Ambient declaration for the global Google Identity Services script
declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private initialized = false;

  /**
   * Initializes the Google One Tap configuration.
   * Safe to call multiple times (idempotent).
   */
  initialize(): void {
    if (this.initialized || typeof google === 'undefined') return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: false
    });

    this.initialized = true;
  }

  /**
   * Prompts the user with the One Tap UI if they are not already logged in.
   */
  promptOneTap(retries = 10): void {
    if (this.auth.isLoggedIn()) {
      return; // Already logged in, do nothing
    }

    if (typeof google === 'undefined') {
      if (retries > 0) {
        setTimeout(() => this.promptOneTap(retries - 1), 200);
      }
      return;
    }

    if (!this.initialized) {
      this.initialize();
    }

    // Displays the popup in the top right
    google.accounts.id.prompt();
  }

  /**
   * Callback fired by Google when the user selects their account.
   */
  private handleCredentialResponse(response: any): void {
    const idToken = response.credential;
    
    // Send the token to our .NET backend for verification
    this.http.post(`${environment.apiUrl}/auth/oauth/google`, {
      provider: 'Google',
      idToken: idToken
    }, { responseType: 'text' }).subscribe({
      next: (tokenStr: string) => {
        // Our backend returns the raw JWT string.
        // We decode it to build the AuthResponse expected by AuthService.
        const decoded = jwtDecode<any>(tokenStr);
        
        const authResponse: AuthResponse = {
          token: tokenStr,
          role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
          username: decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
          userId: parseInt(decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'], 10),
          restaurantId: decoded.restaurantId ? parseInt(decoded.restaurantId, 10) : null
        };

        this.auth.setSession(authResponse);
        this.toast.success(`Welcome back, ${authResponse.username}!`);
      },
      error: (err) => {
        console.error('Google One Tap login failed', err);
        this.toast.error('Google sign-in failed. Please try again.');
      }
    });
  }
}
