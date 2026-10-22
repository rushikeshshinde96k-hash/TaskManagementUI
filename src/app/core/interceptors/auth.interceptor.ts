import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const PUBLIC_AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const withToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/** Attaches the access token and transparently refreshes it once when the API returns 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isApi = req.url.startsWith(environment.apiUrl);
  if (!isApi || PUBLIC_AUTH_ENDPOINTS.some((p) => req.url.includes(p))) {
    return next(req);
  }

  const token = auth.accessToken;
  return next(token ? withToken(req, token) : req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) return throwError(() => err);

      if (!auth.hasRefreshToken) {
        auth.expireSession();
        return throwError(() => err);
      }

      return auth.refresh().pipe(
        switchMap((fresh) => next(withToken(req, fresh))),
        catchError((refreshErr: unknown) => {
          auth.expireSession();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
