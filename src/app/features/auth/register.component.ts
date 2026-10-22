import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/http';
import { IconComponent } from '../../shared/components/icon.component';

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth.css',
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <div class="auth-brand"><span><app-icon name="check" /></span><span>TaskFlow</span></div>
        <h1>Create your account</h1>
        <p>New accounts join as a team member. An admin can change your role.</p>

        @if (error()) {
          <div class="alert alert-error" role="alert" style="margin-bottom:14px">
            <app-icon name="alert" [size]="16" /> {{ error() }}
          </div>
        }

        <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="fullName">Full name</label>
            <input id="fullName" class="input" formControlName="fullName" autocomplete="name" [class.invalid]="invalid('fullName')" />
            @if (invalid('fullName')) { <span class="field-error">Enter your name (2–100 characters).</span> }
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" autocomplete="email" [class.invalid]="invalid('email')" />
            @if (invalid('email')) { <span class="field-error">Enter a valid email address.</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password"
                   aria-describedby="pw-hint" [class.invalid]="invalid('password')" />
            <span id="pw-hint" class="hint" [class.field-error]="invalid('password')">
              At least 8 characters with upper- and lower-case letters, a number and a symbol.
            </span>
          </div>
          <div class="field">
            <label for="confirmPassword">Confirm password</label>
            <input id="confirmPassword" class="input" type="password" formControlName="confirmPassword" autocomplete="new-password"
                   [class.invalid]="mismatch()" />
            @if (mismatch()) { <span class="field-error">Passwords do not match.</span> }
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="auth-foot">Already registered? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  invalid(name: 'fullName' | 'email' | 'password' | 'confirmPassword'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  mismatch(): boolean {
    return this.form.hasError('mismatch') && this.form.controls.confirmPassword.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.toast.success(`Welcome, ${user.fullName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      }
    });
  }
}
