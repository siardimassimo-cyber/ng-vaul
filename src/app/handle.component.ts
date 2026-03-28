import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { DrawerService } from './services/drawer.service';
import { DrawerDirection, DrawerDirectionType } from './types';

@Component({
  selector: 'vaul-handle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="vaul-handle"
      #handleRef
      [attr.data-vaul-handle]=""
      [attr.data-vaul-drawer-visible]="(isOpen$ | async) ? 'true' : 'false'"
      [class.vaul-dragging]="isDragging$ | async"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerCancel($event)"
      aria-hidden="true"
    >
      <span class="vaul-handle-hitarea" [class.vaul-handle-disabled]="disabled()" aria-hidden="true">
        <ng-content></ng-content>
      </span>
    </div>
  `,
  imports: [AsyncPipe],
  styles: [
    `
      .vaul-handle {
        width: 100%;
        user-select: none;
        touch-action: none;
        cursor: grab;
      }

      .vaul-handle-hitarea {
        width: 100%;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vaul-handle.vaul-dragging {
        cursor: grabbing;
      }

      .vaul-handle-disabled {
        pointer-events: none;
      }
    `,
  ],
})
export class HandleComponent {
  private readonly drawerService = inject(DrawerService);
  // Create computed signals from observables
  readonly isOpen$ = this.drawerService.isOpen$;
  readonly isDragging$ = this.drawerService.isDragging$;
  readonly direction = input<DrawerDirectionType>(DrawerDirection.BOTTOM);
  readonly disabled = input(false);

  handleRef = viewChild<ElementRef<HTMLDivElement>>('handleRef');

  public drawerRef = input.required<HTMLDivElement>();

  onPointerDown(event: PointerEvent) {
    if (this.disabled()) return;

    // Capture the pointer to ensure all events go to this element
    this.handleRef()?.nativeElement.setPointerCapture(event.pointerId);

    // Start dragging (pass drawer element so drag math applies to the panel)
    this.drawerService.onPress(event, this.drawerRef());
  }

  onPointerMove(event: PointerEvent) {
    if (this.disabled()) return;

    // Prevent default to avoid text selection
    event.preventDefault();
    // Update drag position on the drawer surface
    this.drawerService.onDrag(event, this.drawerRef());
  }

  onPointerUp(event: PointerEvent) {
    if (this.disabled()) return;

    // Release pointer capture
    this.handleRef()?.nativeElement.releasePointerCapture(event.pointerId);

    // End dragging
    this.drawerService.onRelease(event, this.direction(), this.drawerRef());
  }

  onPointerCancel(event: PointerEvent) {
    if (this.disabled()) return;

    // Release pointer capture
    this.handleRef()?.nativeElement.releasePointerCapture(event.pointerId);

    // End dragging
    this.drawerService.onRelease(event, this.direction(), this.drawerRef());
  }

}
