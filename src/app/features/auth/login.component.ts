import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorMessage } from '../../core/utils/http';
import { IconComponent } from '../../shared/components/icon.component';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@taskmanager.com', password: 'Admin@123' },
  { label: 'Manager', email: 'priya.manager@taskmanager.com', password: 'Manager@123' },
  { label: 'User', email: 'sneha@taskmanager.com', password: 'User@123' }
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.css',
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <div class="auth-brand"><span><app-icon name="check" /></span><span>TaskFlow</span></div>
        <h1>Welcome back</h1>
        <p>Sign in to manage your team's work.</p>

        @if (expired) {
          <div class="alert alert-info" role="status" style="margin-bottom:14px">
            <app-icon name="clock" [size]="16" /> Your session has expired. Please sign in again.
          </div>
        }
        @if (error()) {
          <div class="alert alert-error" role="alert" style="margin-bottom:14px">
            <app-icon name="alert" [size]="16" /> {{ error() }}
          </div>
        }

        <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" autocomplete="username"
                   [class.invalid]="invalid('email')" [attr.aria-invalid]="invalid('email')" />
            @if (invalid('email')) { <span class="field-error">Enter a valid email address.</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" class="input" type="password" formControlName="password" autocomplete="current-password"
                   [class.invalid]="invalid('password')" [attr.aria-invalid]="invalid('password')" />
            @if (invalid('password')) { <span class="field-error">Password is required.</span> }
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-foot">No account? <a routerLink="/register">Create one</a></p>

        <div class="demo">
          <span class="label">Demo accounts</span>
          <div class="demo-buttons">
            @for (d of demo; track d.label) {
              <button type="button" class="btn btn-sm" (click)="fill(d.email, d.password)">{{ d.label }}</button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly demo = DEMO_ACCOUNTS;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly expired = this.route.snapshot.queryParamMap.has('expired');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  fill(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard');
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }
}
