import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, input, output, viewChild } from '@angular/core';
import { IconComponent } from './icon.component';

let nextId = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="closed.emit()"></div>
    <div class="modal" [class.modal-wide]="wide()" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId" #dialog tabindex="-1">
      <header class="modal-header">
        <h2 [id]="titleId">{{ title() }}</h2>
        <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close dialog">
          <app-icon name="x" />
        </button>
      </header>
      <div class="modal-body">
        <ng-content />
      </div>
    </div>
  `
})
export class ModalComponent implements AfterViewInit {
  readonly title = input.required<string>();
  readonly wide = input(false);
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  ngAfterViewInit(): void {
    // Move focus into the dialog: first form field if any, otherwise the dialog itself.
    const el = this.dialog().nativeElement;
    const first = el.querySelector<HTMLElement>('input, select, textarea');
    (first ?? el).focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
