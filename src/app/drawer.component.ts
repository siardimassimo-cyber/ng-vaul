import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  effect,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { noop } from 'rxjs';
import { HandleComponent } from './handle.component';
import { isIOS, isMobileFirefox } from './services/browser';
import { BORDER_RADIUS, DRAG_CLASS, TRANSITIONS, WINDOW_TOP_OFFSET } from './services/constants';
import { DrawerService } from './services/drawer.service';
import { PreventScrollService } from './services/prevent-scroll.service';
import { ScaleBackgroundService } from './services/scale-background.service';
import { DrawerDirection, DrawerDirectionType, SnapPoint } from './types';
import { assignStyle, chain, isInput, isVertical, set } from './utils/helpers';

@Component({
  selector: 'vaul-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:pointerup)': 'onGlobalPointerUp($event)',
    '(window:pointermove)': 'onGlobalPointerMove($event)',
  },
  template: `
    <div
      class="vaul-drawer"
      #drawerRef
      role="dialog"
      aria-label="Drawer panel"
      aria-modal="true"
      [attr.aria-hidden]="drawerService.isOpen() ? null : 'true'"
      [attr.data-vaul-drawer-direction]="direction()"
      [attr.data-state]="drawerService.isOpen() ? 'open' : 'closed'"
      [style.height]="isVertical(direction()) ? initialDrawerHeightorWidth() + 'px' : '100%'"
      [style.width]="isVertical(direction()) ? '100vw' : this.initialDrawerHeightorWidth() + 'px'"
      [style.bottom]="isVertical(direction()) ? '0' : 'auto'"
      [style.top]="direction() === DrawerDirection.TOP ? '0' : 'auto'"
      [style.left]="direction() === DrawerDirection.LEFT ? '0' : 'auto'"
      [style.right]="direction() === DrawerDirection.RIGHT ? '0' : 'auto'"
      (drag)="onDrag($event, drawerRef)"
      (pointerdown)="onPointerDown($event, drawerRef)"
      (pointermove)="onPointerMove($event, drawerRef)"
      (pointerup)="onPointerUp($event, drawerRef)"
      (pointercancel)="onRelease($event, drawerRef, direction())"
    >
      <div class="drawer-content">
        <vaul-handle [drawerRef]="drawerRef">
          <div class="handle-indicator"></div>
        </vaul-handle>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        bottom: 0;
        z-index: var(--vaul-drawer-z-index, 999);
        display: flex;
        flex-direction: column;
        pointer-events: none;
        height: auto;
        left: 0;
      }

      .vaul-drawer {
        position: absolute;
        width: auto;
        max-width: 100%;
        height: auto;
        overflow: hidden;
        pointer-events: auto;
        background: var(--color-white);
        will-change: transform;
        cursor: grab;
      }
      .drawer-content {
        height: 100%;
      }
      .vaul-drawer:active {
        cursor: grabbing;
      }
    `,
  ],
  imports: [HandleComponent],
})
export class DrawerComponent implements OnDestroy {
  public fixed = input(true);
  readonly drawerService = inject(DrawerService);
  private readonly scaleBackgroundService = inject(ScaleBackgroundService);
  private readonly preventScrollService = inject(PreventScrollService);
  private readonly destroyRef$ = inject(DestroyRef);
  readonly direction = input<DrawerDirectionType>(DrawerDirection.BOTTOM);
  readonly shouldScaleBackground = input(true);
  readonly modal = input(true);
  readonly nested = input(false);
  readonly repositionInputs = input(true);
  readonly autoFocus = input(false);
  readonly open = input(false);
  readonly dismissible = input(true);
  readonly openChange = output<boolean>();

  readonly snapPoints = input<SnapPoint[] | null>(null);
  readonly activeSnapPoint = input<SnapPoint | null>(null);
  readonly fadeFromIndex = input<number | undefined>(undefined);
  readonly snapToSequentialPoint = input(false);
  readonly activeSnapPointChange = output<SnapPoint | null>();

  private cacheDirection: DrawerDirectionType | null = null;

  drawerRef = viewChild<ElementRef<HTMLDivElement>>('drawerRef');

  initialDrawerHeightorWidth = model<number>(400);
  private readonly keyboardIsOpen = signal(false);
  private readonly previousDiffFromInitial = signal(0);
  public isVertical = isVertical;
  public DrawerDirection = DrawerDirection;

  constructor() {
    this.drawerService.setOpenTime(new Date());

    effect(() => {
      this.drawerService.setIsOpen(this.open());
    });

    effect(() => {
      this.drawerService.setDirection(this.direction());
      this.drawerService.setScaleBackground(this.shouldScaleBackground());
      this.drawerService.setModal(this.modal());
      this.drawerService.setNested(this.nested());

      this.drawerService.setSnapPoints(this.snapPoints());
      this.drawerService.setActiveSnapPoint(this.activeSnapPoint());
      this.drawerService.setFadeFromIndex(this.fadeFromIndex());
      this.drawerService.setSnapToSequentialPoint(this.snapToSequentialPoint());
    });

    // Emit activeSnapPointChange whenever the active snap point changes
    effect(() => {
      this.activeSnapPointChange.emit(this.drawerService.activeSnapPoint());
    });

    // React to state changes that affect the drawer DOM and background scaling
    effect((onCleanup) => {
      const isOpen = this.drawerService.isOpen();
      const shouldScale = this.drawerService.shouldScaleBackground();
      const direction = this.drawerService.direction();
      const setBackgroundColor = this.drawerService.backgroundColorOnScale();
      const noBodyStyles = this.drawerService.noBodyStyles();

      const drawerRef = this.drawerRef();
      if (drawerRef?.nativeElement && this.cacheDirection !== direction) {
        this.cacheDirection = direction;
        this.drawerService.setDrawerRef(drawerRef.nativeElement);
        const offset = this.drawerService.getTranslateBasedOnDirection({
          drawer: drawerRef.nativeElement,
          direction,
        });
        const transform = isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
        set(drawerRef.nativeElement, {
          transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
          transform,
        });
      }

      this.openChange.emit(isOpen);

      if (isOpen && shouldScale) {
        if (this.scaleBackgroundService.timeoutId) {
          clearTimeout(this.scaleBackgroundService.timeoutId);
        }
        const wrapper =
          (document.querySelector('[data-vaul-drawer-wrapper]') as HTMLElement) ||
          (document.querySelector('[vaul-drawer-wrapper]') as HTMLElement);

        if (!wrapper) return;
        chain(
          setBackgroundColor && !noBodyStyles
            ? assignStyle(document.body, { background: 'black' })
            : noop,
          assignStyle(wrapper, {
            transformOrigin: isVertical(direction) ? 'top' : 'left',
            transitionProperty: 'transform, border-radius',
            transitionDuration: `${TRANSITIONS.DURATION}s`,
            transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
          }),
        );

        const wrapperStylesCleanup = assignStyle(wrapper, {
          borderRadius: `${BORDER_RADIUS}px`,
          overflow: 'hidden',
          transform: `scale(${this.drawerService.getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
        });

        onCleanup(() => {
          wrapperStylesCleanup();
          this.scaleBackgroundService.timeoutId = window.setTimeout(() => {
            const initialBg = this.scaleBackgroundService.initialBackgroundColor();
            if (initialBg) {
              document.body.style.background = initialBg;
            } else {
              document.body.style.removeProperty('background');
            }
          }, TRANSITIONS.DURATION * 1000);
        });
      }
    });

    afterNextRender(() => {
      this.setupVisualViewport();
      let preventScrollCount = 0;
      preventScrollCount++;
      if (preventScrollCount === 1) {
        if (isIOS()) {
          this.preventScrollService.preventScrollMobileSafari();
        }
      }
    });
  }

  private onVisualViewportChange() {
    const drawer = this.drawerRef()?.nativeElement;
    if (!drawer) return;
    const focusedElement = document.activeElement as HTMLElement;
    if (isInput(focusedElement) || this.keyboardIsOpen()) {
      const visualViewportHeight = window.visualViewport?.height || 0;
      const totalHeight = window.innerHeight;
      let diffFromInitial = totalHeight - visualViewportHeight;
      const drawerHeight = drawer.getBoundingClientRect().height || 0;
      const isTallEnough = drawerHeight > totalHeight * 0.8;

      if (!this.initialDrawerHeightorWidth()) {
        this.initialDrawerHeightorWidth.set(drawerHeight);
      }
      const offsetFromTop = drawer.getBoundingClientRect().top;

      if (Math.abs(this.previousDiffFromInitial() - diffFromInitial) > 60) {
        this.keyboardIsOpen.set(!this.keyboardIsOpen());
      }
      this.previousDiffFromInitial.set(diffFromInitial);
      if (drawerHeight > visualViewportHeight || this.keyboardIsOpen()) {
        const height = drawer.getBoundingClientRect().height;
        let newDrawerHeight = height;
        if (isVertical(this.direction())) {
          if (height > visualViewportHeight) {
            newDrawerHeight = visualViewportHeight - (isTallEnough ? offsetFromTop : WINDOW_TOP_OFFSET);
          }
          if (this.fixed()) {
            drawer.style.height = `${height - Math.max(diffFromInitial, 0)}px`;
          } else {
            drawer.style.height = `${Math.max(newDrawerHeight, visualViewportHeight - offsetFromTop)}px`;
          }
        } else {
          if (this.fixed()) {
            drawer.style.height = `${height - Math.max(diffFromInitial, 0)}px`;
          } else {
            drawer.style.height = `${Math.max(newDrawerHeight, visualViewportHeight - offsetFromTop)}px`;
          }
        }
      } else if (!isMobileFirefox()) {
        drawer.style.height = `${this.initialDrawerHeightorWidth()}px`;
      }

      if (!this.keyboardIsOpen()) {
        drawer.style.bottom = `0px`;
      } else {
        drawer.style.bottom = `${Math.max(diffFromInitial, 0)}px`;
      }
    }
  }

  private setupVisualViewport() {
    if (typeof window === 'undefined' || !window.visualViewport || !this.repositionInputs()) {
      return;
    }
    window.visualViewport.addEventListener('resize', this.onVisualViewportChange.bind(this));
  }

  ngOnDestroy() {
    window.visualViewport?.removeEventListener('resize', this.onVisualViewportChange.bind(this));
    this.drawerService.setDrawerRef(null);
  }

  onGlobalPointerUp(event: PointerEvent) {
    if (this.drawerService.isDragging()) {
      const drawerRef = this.drawerRef()?.nativeElement;
      if (drawerRef) {
        this.onPointerUp(event, drawerRef);
      }
    }
  }

  onGlobalPointerMove(event: PointerEvent) {
    if (this.drawerService.isDragging()) {
      const drawerRef = this.drawerRef()?.nativeElement;
      if (drawerRef) {
        this.onPointerMove(event, drawerRef);
      }
    }
  }

  onPointerDown(event: PointerEvent, element: HTMLDivElement) {
    element.setPointerCapture(event.pointerId);
    this.drawerService.pointerStart.set({
      x: event.clientX,
      y: event.clientY,
    });
    this.onPress(event, element);
  }

  onPointerUp(event: PointerEvent, element: HTMLDivElement) {
    element.releasePointerCapture(event.pointerId);
    this.drawerService.pointerStart.set(null);
    this.drawerService.wasBeyondThePoint.set(false);
    this.onRelease(event, element, this.direction());
  }

  onPointerMove(event: PointerEvent, element: HTMLDivElement) {
    if (!this.drawerService.pointerStart()) return;
    const yPosition = event.clientY - (this.drawerService.pointerStart()?.y ?? 0);
    const xPosition = event.clientX - (this.drawerService.pointerStart()?.x ?? 0);

    const swipeStartThreshold: number = event.pointerType === 'touch' ? 10 : 2;
    const delta = { x: xPosition, y: yPosition };
    const direction = isVertical(this.direction())
      ? yPosition > 0
        ? 'bottom'
        : 'top'
      : xPosition > 0
        ? 'right'
        : 'left';

    const isAllowedToSwipe = this.isDeltaInDirection(delta, direction, swipeStartThreshold);
    if (isAllowedToSwipe) {
      if (!this.drawerService.isDragging()) {
        this.drawerService.setIsDragging(true);
      }
      this.onDrag(event, element);
    } else if (Math.abs(isVertical(this.direction()) ? yPosition : xPosition) > swipeStartThreshold) {
      this.drawerService.pointerStart.set(null);
    }
  }

  private isDeltaInDirection(delta: { x: number; y: number }, direction: string, threshold = 0) {
    if (this.drawerService.wasBeyondThePoint()) return true;

    const isHorizontal = ['left', 'right'].includes(direction);
    const deltaValue = isHorizontal ? Math.abs(delta.x) : Math.abs(delta.y);
    const rawDelta = isHorizontal ? delta.x : delta.y;
    const dFactor = ['bottom', 'right'].includes(direction) ? 1 : -1;

    const isReverseDirection = rawDelta * dFactor < 0;
    if (!isReverseDirection && deltaValue >= 0 && deltaValue <= threshold) {
      return false;
    }

    this.drawerService.wasBeyondThePoint.set(true);
    return true;
  }

  onPress(event: PointerEvent, element: HTMLDivElement) {
    this.drawerService.onPress(event, element);
  }

  onDrag(event: DragEvent | PointerEvent, element: HTMLDivElement) {
    this.drawerService.onDrag(event, element, this.dismissible());
  }

  cancelDrag(element?: HTMLDivElement) {
    if (!this.drawerService.isDragging() || !element) return;
    element.classList.remove(DRAG_CLASS);
    this.drawerService.isAllowedToDrag.set(false);
    this.drawerService.setIsDragging(false);
    this.drawerService.dragEndTime.set(new Date());
  }

  onRelease(event: PointerEvent, element: HTMLDivElement, direction: DrawerDirectionType) {
    this.drawerService.onRelease(event, direction, element);
  }
}
