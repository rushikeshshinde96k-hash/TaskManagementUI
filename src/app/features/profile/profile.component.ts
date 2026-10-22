import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/http';
import { AvatarComponent, RoleBadgeComponent } from '../../shared/components/badges.component';
import { PASSWORD_PATTERN } from '../auth/register.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, AvatarComponent, RoleBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:860px">
      <div class="page-header"><div><h1>Profile</h1><p>Your account details and password.</p></div></div>

      @if (auth.user(); as u) {
        <section class="card card-body" style="margin-bottom:16px">
          <div class="row">
            <app-avatar [name]="u.fullName" />
            <div>
              <h2>{{ u.fullName }}</h2>
              <span class="muted">{{ u.email }}</span>
            </div>
            <span class="spacer"></span>
            <app-role-badge [role]="u.role" />
          </div>
          @if (u.teams.length) {
            <p class="muted small" style="margin-top:12px">Teams: {{ teamNames() }}</p>
          }
        </section>
      }

      <div class="grid grid-2">
        <section class="card card-body" aria-labelledby="p-name-title">
          <h2 id="p-name-title" style="margin-bottom:14px">Display name</h2>
          @if (nameError()) { <div class="alert alert-error" role="alert" style="margin-bottom:12px">{{ nameError() }}</div> }
          <form class="form" [formGroup]="nameForm" (ngSubmit)="saveName()">
            <div class="field">
              <label for="p-name">Full name</label>
              <input id="p-name" class="input" formControlName="fullName" />
            </div>
            <div class="form-actions"><button class="btn btn-primary" type="submit" [disabled]="nameForm.invalid || nameForm.pristine">Save</button></div>
          </form>
        </section>

        <section class="card card-body" aria-labelledby="p-pass-title">
          <h2 id="p-pass-title" style="margin-bottom:14px">Change password</h2>
          @if (passError()) { <div class="alert alert-error" role="alert" style="margin-bottom:12px">{{ passError() }}</div> }
          <form class="form" [formGroup]="passForm" (ngSubmit)="savePassword()">
            <div class="field">
              <label for="p-current">Current password</label>
              <input id="p-current" class="input" type="password" formControlName="currentPassword" autocomplete="current-password" />
            </div>
            <div class="field">
              <label for="p-new">New password</label>
              <input id="p-new" class="input" type="password" formControlName="newPassword" autocomplete="new-password" />
              <span class="hint" [class.field-error]="passForm.controls.newPassword.invalid && passForm.controls.newPassword.touched">
                8+ characters with upper, lower, number and symbol.
              </span>
            </div>
            <div class="form-actions"><button class="btn btn-primary" type="submit" [disabled]="passForm.invalid">Update password</button></div>
          </form>
        </section>
      </div>
    </div>
  `
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly nameError = signal<string | null>(null);
  protected readonly passError = signal<string | null>(null);

  protected readonly nameForm = this.fb.nonNullable.group({
    fullName: [this.auth.user()?.fullName ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
  });

  protected readonly passForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
  });

  teamNames(): string {
    return this.auth.user()?.teams.map((t) => t.teamName).join(', ') ?? '';
  }

  saveName(): void {
    this.nameError.set(null);
    this.usersApi.updateProfile(this.nameForm.getRawValue().fullName.trim()).subscribe({
      next: (u) => {
        this.auth.updateUser(u);
        this.nameForm.markAsPristine();
        this.toast.success('Profile updated.');
      },
      error: (err) => this.nameError.set(apiErrorMessage(err))
    });
  }

  savePassword(): void {
    this.passError.set(null);
    const { currentPassword, newPassword } = this.passForm.getRawValue();
    this.usersApi.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        // The API revokes all refresh tokens on a password change, so start a fresh session.
        this.toast.success('Password changed. Please sign in with your new password.');
        this.auth.logout();
      },
      error: (err) => this.passError.set(apiErrorMessage(err))
    });
  }
}
