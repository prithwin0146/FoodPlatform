import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';

/**
 * Global HTTP error interceptor.
 * (SRP: maps HTTP error codes → user-friendly toast messages; no business logic here)
 * (DIP: depends on ToastService abstraction, not a concrete UI component)
 *
 * Handles:
 *  - 401 Unauthorized → redirect to /login
 *  - 403 Forbidden → "You don't have permission to do that"
 *  - 429 Too Many Requests → "Too many attempts — please wait a moment"
 *  - 0 / network → "Cannot reach the server — check your connection"
 *  - 5xx Server Error → "Server error — please try again shortly"
 *  - All others → API-provided message or generic fallback
 */
/** Attach this header to suppress the global error toast for a specific request. */
export const SILENT_ERROR_HEADER = 'X-Silent-Error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  // Strip the sentinel header before sending to the server
  const silent = req.headers.has(SILENT_ERROR_HEADER);
  const cleanReq = silent ? req.clone({ headers: req.headers.delete(SILENT_ERROR_HEADER) }) : req;

  return next(cleanReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401: session expired or not logged in — silent redirect, no toast spam
      if (err.status === 401) {
        router.navigate(['/login'], { replaceUrl: true });
        return throwError(() => err);
      }

      // Suppress toast if caller opted out (e.g. retry-handled calls)
      if (!silent) {
        toast.error(resolveMessage(err));
      }
      return throwError(() => err);
    }),
  );
};

function resolveMessage(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'Cannot reach the server — check your connection';
  }
  if (err.status === 403) {
    return "You don't have permission to do that";
  }
  if (err.status === 429) {
    return 'Too many attempts — please wait a moment';
  }
  if (err.status >= 500) {
    return 'Server error — please try again shortly';
  }

  // Prefer the API's own message if it provides one (e.g. validation errors)
  const body = err.error;
  if (typeof body === 'string' && body.length > 0) return body;
  
  // Extract specific validation error from ASP.NET Core ProblemDetails
  if (body?.errors && typeof body.errors === 'object') {
    const firstKey = Object.keys(body.errors)[0];
    if (firstKey && Array.isArray(body.errors[firstKey]) && body.errors[firstKey].length > 0) {
      return body.errors[firstKey][0];
    }
  }
  
  if (body?.message) return body.message as string;
  if (body?.error) return body.error as string; // Custom API errors
  if (body?.title) return body.title as string; // Fallback to generic title

  return 'Something went wrong';
}
