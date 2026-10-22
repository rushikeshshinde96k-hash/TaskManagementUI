import { HttpContextToken, HttpErrorResponse, HttpParams } from '@angular/common/http';

/** Set on a request when the calling component shows the error itself (e.g. inline form errors). */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** Builds query params, skipping null/undefined/empty values. */
export function toParams(obj: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === '') continue;
    params = params.set(key, String(value));
  }
  return params;
}

/** Turns an API ProblemDetails / ValidationProblemDetails response into a readable message. */
export function apiErrorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Something went wrong.';
  if (err.status === 0) return 'Cannot reach the server. Check that the API is running.';

  const body = err.error as { detail?: string; title?: string; errors?: Record<string, string[]> } | null;
  if (body?.errors) {
    const messages = Object.values(body.errors).flat();
    if (messages.length) return messages.join(' ');
  }
  if (body?.detail) return body.detail;
  if (body?.title) return body.title;

  switch (err.status) {
    case 403: return 'You do not have permission to do that.';
    case 404: return 'The requested item was not found.';
    case 500: return 'Server error. Please try again later.';
    default: return err.message || 'Request failed.';
  }
}
