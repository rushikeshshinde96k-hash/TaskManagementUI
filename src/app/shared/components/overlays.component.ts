import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast toast-' + t.type" [attr.role]="t.type === 'error' ? 'alert' : 'status'">
          <app-icon [name]="t.type === 'error' ? 'alert' : 'check'" />
          <span>{{ t.message }}</span>
          <button type="button" class="icon-btn" (click)="toast.dismiss(t.id)" aria-label="Dismiss notification">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `
})
export class ToastsComponent {
  protected readonly toast = inject(ToastService);
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.current(); as c) {
      <app-modal [title]="c.title" (closed)="confirm.close(false)">
        <p class="muted">{{ c.message }}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" (click)="confirm.close(false)">Cancel</button>
          <button type="button" class="btn" [class.btn-danger]="c.danger" [class.btn-primary]="!c.danger" (click)="confirm.close(true)">
            {{ c.confirmText ?? 'Confirm' }}
          </button>
        </div>
      </app-modal>
    }
  `
})
export class ConfirmDialogComponent {
  protected readonly confirm = inject(ConfirmService);
}
