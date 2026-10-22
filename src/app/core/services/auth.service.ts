import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, UserRole } from '../models/models';
import { SKIP_ERROR_TOAST } from '../utils/http';

interface StoredSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
}

const STORAGE_KEY = 'tm.session';

/**
 * Holds the JWT session. Access tokens are short-lived; when the API answers 401 the auth
 * interceptor calls {@link refresh} once (shared between parallel requests). When the refresh
 * token itself expires the user is signed out with a "session expired" message.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = `${environment.apiUrl}/auth`;

  private readonly session = signal<StoredSession | null>(this.load());
  private refresh$: Observable<string> | null = null;
  private expiryTimer?: ReturnType<typeof setTimeout>;

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'Admin');
  readonly isManager = computed(() => this.role() === 'Manager');
  readonly canManageTasks = computed(() => this.isAdmin() || this.isManager());

  constructor() {
    this.scheduleExpiry();
  }

  get accessToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  get hasRefreshToken(): boolean {
    return !!this.session()?.refreshToken;
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.role();
    return !!role && roles.includes(role);
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password }, { context: this.silent() })
      .pipe(tap((r) => this.store(r)), map((r) => r.user));
  }

  register(payload: { fullName: string; email: string; password: string; confirmPassword: string }): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.api}/register`, payload, { context: this.silent() })
      .pipe(tap((r) => this.store(r)), map((r) => r.user));
  }

  /** Returns a fresh access token. Concurrent callers share one in-flight request. */
  refresh(): Observable<string> {
    const refreshToken = this.session()?.refreshToken;
    if (!refreshToken) throw new Error('No refresh token');

    this.refresh$ ??= this.http
      .post<AuthResponse>(`${this.api}/refresh`, { refreshToken }, { context: this.silent() })
      .pipe(
        tap((r) => this.store(r)),
        map((r) => r.accessToken),
        finalize(() => (this.refresh$ = null)),
        shareReplay(1)
      );
    return this.refresh$;
  }

  /** Updates the cached user (e.g. after editing the profile). */
  updateUser(user: User): void {
    const s = this.session();
    if (s) this.persist({ ...s, user });
  }

  logout(): void {
    const refreshToken = this.session()?.refreshToken;
    if (refreshToken) {
      this.http.post(`${this.api}/logout`, { refreshToken }, { context: this.silent() }).subscribe({ error: () => {} });
    }
    this.clear();
    this.router.navigate(['/login']);
  }

  /** Called when the session can no longer be refreshed. */
  expireSession(): void {
    if (!this.session()) return;
    this.clear();
    this.router.navigate(['/login'], { queryParams: { expired: 1, returnUrl: this.router.url } });
  }

  private store(r: AuthResponse): void {
    this.persist({
      accessToken: r.accessToken,
      accessTokenExpiresAt: r.accessTokenExpiresAt,
      refreshToken: r.refreshToken,
      refreshTokenExpiresAt: r.refreshTokenExpiresAt,
      user: r.user
    });
  }

  private persist(s: StoredSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    this.session.set(s);
    this.scheduleExpiry();
  }

  private clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    clearTimeout(this.expiryTimer);
  }

  private load(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as StoredSession;
      // Discard sessions whose refresh token has already expired.
      return new Date(s.refreshTokenExpiresAt).getTime() > Date.now() ? s : null;
    } catch {
      return null;
    }
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    const s = this.session();
    if (!s) return;
    const ms = new Date(s.refreshTokenExpiresAt).getTime() - Date.now();
    // setTimeout overflows above ~24.8 days; refresh tokens live 7 days by default.
    this.expiryTimer = setTimeout(() => this.expireSession(), Math.max(0, Math.min(ms, 2_147_000_000)));
  }

  private silent(): HttpContext {
    return new HttpContext().set(SKIP_ERROR_TOAST, true);
  }
}
