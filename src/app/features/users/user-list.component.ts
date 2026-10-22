import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserRole } from '../../core/models/models';
import { UserService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/utils/http';
import { ROLES } from '../../core/utils/labels';
import { AvatarComponent } from '../../shared/components/badges.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { PASSWORD_PATTERN } from '../auth/register.component';

/** Admin: manage accounts, roles and activation. */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, IconComponent, AvatarComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.component.html',
  styles: [`
    .toolbar { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; padding: 14px 16px; }
    .role-select { width: 130px; height: 32px; }
    .teams { display: flex; gap: 4px; flex-wrap: wrap; }
    .inactive td { opacity: .6; }
    @media (max-width: 640px) { .toolbar { grid-template-columns: 1fr; } }
  `]
})
export class UserListComponent implements OnInit {
  private readonly usersApi = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly roles = ROLES;
  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly roleFilter = signal<UserRole | null>(null);
  protected readonly statusFilter = signal<boolean | null>(null);
  protected readonly creating = signal(false);
  protected readonly saving = signal(false);
  protected readonly createError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
    role: ['User' as UserRole, Validators.required]
  });

  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.usersApi.list({ search: this.search(), role: this.roleFilter(), isActive: this.statusFilter() }).subscribe({
      next: (u) => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  async changeRole(user: User, role: UserRole): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Change role?',
      message: `${user.fullName} will become ${role === 'Admin' ? 'an' : 'a'} ${role}. Their permissions change on next sign-in.`,
      confirmText: 'Change role'
    });
    if (!ok) { this.load(); return; }
    this.usersApi.updateRole(user.id, role).subscribe({
      next: (u) => { this.replace(u); this.toast.success(`${u.fullName} is now ${u.role}.`); },
      error: () => this.load()
    });
  }

  async toggleActive(user: User): Promise<void> {
    if (user.isActive) {
      const ok = await this.confirm.ask({
        title: 'Deactivate user?',
        message: `${user.fullName} will be signed out and won't be able to log in.`,
        confirmText: 'Deactivate',
        danger: true
      });
      if (!ok) return;
    }
    this.usersApi.updateStatus(user.id, !user.isActive).subscribe((u) => {
      this.replace(u);
      this.toast.success(`${u.fullName} ${u.isActive ? 'activated' : 'deactivated'}.`);
    });
  }

  openCreate(): void {
    this.form.reset({ fullName: '', email: '', password: '', role: 'User' });
    this.createError.set(null);
    this.creating.set(true);
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.usersApi.create(this.form.getRawValue()).subscribe({
      next: (u) => {
        this.users.update((list) => [...list, u].sort((a, b) => a.fullName.localeCompare(b.fullName)));
        this.creating.set(false);
        this.saving.set(false);
        this.toast.success(`${u.fullName} created.`);
      },
      error: (err) => {
        this.createError.set(apiErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  touchedInvalid(name: 'fullName' | 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }

  private replace(u: User): void {
    this.users.update((list) => list.map((x) => (x.id === u.id ? u : x)));
  }
}
