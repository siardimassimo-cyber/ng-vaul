import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { DrawerService } from './services/drawer.service';
import { DrawerDirection, DrawerDirectionType } from './types';

@Component({
  selector: 'vaul-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      id="drawer-overlay-backdrop"
      class="vaul-overlay"
      #overlayRef
      [attr.data-vaul-overlay]=""
      [attr.data-state]="(isOpen$ | async) ? 'open' : 'closed'"
      [attr.aria-label]="'Close drawer overlay'"
      [attr.aria-hidden]="(isOpen$ | async) ? null : 'true'"
      (click)="close()"
      (pointerup)="onRelease($event)"
    ></button>
  `,
  styles: [
    `
      .vaul-overlay {
        position: fixed;
        inset: 0;
        margin: 0;
        padding: 0;
        border: none;
        display: block;
        width: 100%;
        height: 100%;
        background: var(--color-overlay);
        pointer-events: none;
        z-index: -1;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        cursor: pointer;
        font: inherit;
        color: inherit;
      }

      .vaul-overlay[data-state='open'] {
        opacity: 1;
        pointer-events: auto;
        z-index: var(--vaul-overlay-z-index, 998);
      }
    `,
  ],
  imports: [AsyncPipe],
})
export class OverlayComponent implements AfterViewInit, OnDestroy {
  private readonly drawerService = inject(DrawerService);
  private readonly destroy$ = new Subject<void>();
  public direction = input<DrawerDirectionType>(DrawerDirection.BOTTOM);
  /** When false, pointer clicks on the overlay do not close the drawer. */
  readonly dismissible = input(true);

  overlayRef = viewChild<ElementRef<HTMLButtonElement>>('overlayRef');

  readonly isOpen$ = this.drawerService.isOpen$;

  ngAfterViewInit() {
    const overlayRef = this.overlayRef();
    if (!overlayRef) return;
    this.drawerService.setOverlayRef(overlayRef.nativeElement);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close() {
    if (!this.dismissible()) {
      return;
    }
    this.drawerService.setIsOpen(false);
  }

  onRelease(event: PointerEvent) {
    this.drawerService.onRelease(event, this.direction());
  }
}
