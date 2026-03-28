import { inject, Injectable, OnDestroy } from '@angular/core';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import { DrawerDomService } from './drawer-dom.service';
import { DrawerDragService } from './drawer-drag.service';
import { DrawerSnapService } from './drawer-snap.service';
import { DrawerStateService } from './drawer-state.service';
import { DrawerDirectionType } from '../types';
import { isVertical } from '../utils/helpers';

/**
 * Facade that wires together the four focused drawer sub-services and
 * exposes a stable public API consumed by all drawer components.
 *
 * Prefer injecting a specific sub-service directly when only a narrow
 * slice of functionality is needed in a new component.
 */
@Injectable({ providedIn: 'root' })
export class DrawerService implements OnDestroy {
  private readonly state = inject(DrawerStateService);
  private readonly dom = inject(DrawerDomService);
  private readonly snap = inject(DrawerSnapService);
  private readonly drag = inject(DrawerDragService);
  private readonly destroy$ = new Subject<void>();

  // ── State re-exports ──────────────────────────────────────────────────────
  readonly stateChange$ = this.state.stateChange$;
  readonly isOpen$ = this.state.isOpen$;
  readonly isDragging$ = this.state.isDragging$;
  readonly isDraggingObs$ = this.state.isDragging$.asObservable();
  readonly drawerRef$ = this.state.drawerRef$;
  readonly drawerRefObs$ = this.state.drawerRef$.asObservable();
  readonly overlayRef$ = this.state.overlayRef$;
  readonly direction$ = this.state.direction$;
  readonly hasBeenOpened$ = this.state.hasBeenOpened$;
  readonly openTime$ = this.state.openTime$;
  readonly shouldScaleBackground$ = this.state.shouldScaleBackground$;
  readonly setBackgroundColorOnScale$ = this.state.setBackgroundColorOnScale$;
  readonly noBodyStyles$ = this.state.noBodyStyles$;
  readonly nested$ = this.state.nested$;
  readonly modal$ = this.state.modal$;
  readonly preventScrollRestoration$ = this.state.preventScrollRestoration$;

  // ── Drag re-exports ───────────────────────────────────────────────────────
  readonly pointerStart$ = this.drag.pointerStart$;
  readonly dragStartPosition$ = this.drag.dragStartPosition$;
  readonly currentPointerPositionObs$ = this.drag.currentPointerPositionObs$;
  readonly wasBeyondThePoint$ = this.drag.wasBeyondThePoint$;
  readonly dragEndTime$ = this.drag.dragEndTime$;
  readonly dragStartTime$ = this.drag.dragStartTime$;
  readonly isAllowedToDrag$ = this.drag.isAllowedToDrag$;

  // ── Snap re-exports ───────────────────────────────────────────────────────
  readonly snapPoints$ = this.snap.snapPoints$;
  readonly activeSnapPoint$ = this.snap.activeSnapPoint$;
  readonly fadeFromIndex$ = this.snap.fadeFromIndex$;
  readonly snapToSequentialPoint$ = this.snap.snapToSequentialPoint$;
  readonly activeSnapPointIndex$ = this.snap.activeSnapPointIndex$;

  readonly drawerTransform$ = combineLatest([this.drawerRefObs$, this.isDraggingObs$]).pipe(
    map(([drawer, isDragging]) => {
      if (!drawer) return null;
      const offset = isDragging ? this.drag.calculateDragDelta() : 0;
      const direction = this.state.direction$.value;
      return isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
    }),
  );

  constructor() {
    // Sync initial hide transform whenever the drawer element is registered
    this.drawerRefObs$.pipe(takeUntil(this.destroy$)).subscribe((drawer) => {
      if (!drawer || this.state.isOpen$.value) return;
      const direction = this.state.direction$.value;
      const offset = this.dom.getTranslateBasedOnDirection({ drawer, direction });
      drawer.style.transform = isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
    });

    // Sync drawer position with open/close state changes
    this.isOpen$.pipe(takeUntil(this.destroy$)).subscribe((isOpen) => {
      const drawer = this.state.drawerRef$.value;
      if (!drawer) return;

      if (!isOpen) {
        const direction = this.state.direction$.value;
        const offset = this.dom.getTranslateBasedOnDirection({ drawer, direction });
        drawer.style.transform = isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
      } else {
        const snapPoints = this.snap.snapPoints$.value;
        if (snapPoints && snapPoints.length > 0) {
          const activePoint = this.snap.activeSnapPoint$.value ?? snapPoints[0];
          this.snap.snapToPoint(activePoint);
        }
      }
    });
  }

  // ── State delegates ───────────────────────────────────────────────────────
  setIsOpen(isOpen: boolean): void {
    this.state.setIsOpen(isOpen);
  }
  setIsDragging(isDragging: boolean): void {
    this.state.setIsDragging(isDragging);
  }
  setDirection(direction: DrawerDirectionType): void {
    this.state.setDirection(direction);
  }

  setDrawerRef(ref: HTMLDivElement | null): void {
    if (ref) {
      const direction = this.state.direction$.value;
      const offset = this.dom.getTranslateBasedOnDirection({ drawer: ref, direction });
      ref.style.transform = isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
    }
    this.state.setDrawerRef(ref);
  }

  setOverlayRef(ref: HTMLElement | null): void {
    this.state.setOverlayRef(ref);
  }
  setScaleBackground(value: boolean): void {
    this.state.setScaleBackground(value);
  }
  setBackgroundColor(value: boolean): void {
    this.state.setBackgroundColor(value);
  }
  setNoBodyStyles(value: boolean): void {
    this.state.setNoBodyStyles(value);
  }
  setNested(value: boolean): void {
    this.state.setNested(value);
  }
  setModal(value: boolean): void {
    this.state.setModal(value);
  }
  setHasBeenOpened(value: boolean): void {
    this.state.setHasBeenOpened(value);
  }
  setPreventScrollRestoration(value: boolean): void {
    this.state.setPreventScrollRestoration(value);
  }

  shouldScaleBackground(): boolean {
    return this.state.getShouldScaleBackground();
  }
  setBackgroundColorOnScale(): boolean {
    return this.state.getBackgroundColorOnScale();
  }
  noBodyStyles(): boolean {
    return this.state.getNoBodyStyles();
  }
  nested(): boolean {
    return this.state.getNested();
  }
  modal(): boolean {
    return this.state.getModal();
  }
  hasBeenOpened(): boolean {
    return this.state.getHasBeenOpened();
  }
  preventScrollRestoration(): boolean {
    return this.state.getPreventScrollRestoration();
  }

  // ── Drag delegates ────────────────────────────────────────────────────────
  onPress(event: PointerEvent, element?: HTMLDivElement): void {
    this.drag.onPress(event, element);
  }

  onDrag(event: DragEvent | PointerEvent, element?: HTMLDivElement, dismissible = true): void {
    this.drag.onDrag(event, element, dismissible);
  }

  onRelease(event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement): void {
    this.drag.onRelease(event, direction, element);
  }

  shouldDrag(el: EventTarget, isDraggingInDirection: boolean): boolean {
    return this.drag.shouldDrag(el, isDraggingInDirection);
  }

  resetDrawer(direction: DrawerDirectionType, element?: HTMLDivElement): void {
    this.drag.resetDrawer(direction, element);
  }

  closeDrawer(drawer: HTMLDivElement): void {
    this.drag.closeDrawer(drawer);
  }

  // ── Snap delegates ────────────────────────────────────────────────────────
  getSnapPointsOffset(): number[] {
    return this.snap.getSnapPointsOffset();
  }
  goToAdjacentSnap(step: 1 | -1): void {
    this.snap.goToAdjacentSnap(step);
  }

  // ── DOM delegates ─────────────────────────────────────────────────────────
  getTranslateBasedOnDirection({
    drawer,
    direction,
  }: {
    drawer: HTMLDivElement;
    direction: DrawerDirectionType;
  }): number {
    return this.dom.getTranslateBasedOnDirection({ drawer, direction });
  }

  getScale(): number {
    return this.dom.getScale();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
