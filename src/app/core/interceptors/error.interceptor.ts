import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { SKIP_ERROR_TOAST, apiErrorMessage } from '../utils/http';

/** Shows a toast for failed API calls, unless the caller opted out with SKIP_ERROR_TOAST. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      // 401s are handled by the auth interceptor (refresh or redirect to login).
      const handled = req.context.get(SKIP_ERROR_TOAST) || (err instanceof HttpErrorResponse && err.status === 401);
      if (!handled) toast.error(apiErrorMessage(err));
      return throwError(() => err);
    })
  );
};
