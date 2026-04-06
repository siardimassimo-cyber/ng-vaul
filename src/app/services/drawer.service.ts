import { computed, effect, inject, Injectable, untracked } from '@angular/core';
import { DrawerDomService } from './drawer-dom.service';
import { DrawerDragService } from './drawer-drag.service';
import { DrawerSnapService } from './drawer-snap.service';
import { DrawerStateService } from './drawer-state.service';
import { DrawerDirectionType, SnapPoint } from '../types';
import { isVertical } from '../utils/helpers';

/**
 * Facade that wires together the four focused drawer sub-services and
 * exposes a stable public API consumed by all drawer components.
 *
 * Prefer injecting a specific sub-service directly when only a narrow
 * slice of functionality is needed in a new component.
 */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly state = inject(DrawerStateService);
  private readonly dom = inject(DrawerDomService);
  private readonly snap = inject(DrawerSnapService);
  private readonly drag = inject(DrawerDragService);

  // ── State re-exports ──────────────────────────────────────────────────────
  readonly stateChange = this.state.stateChange;
  readonly isOpen = this.state.isOpen;
  readonly isDragging = this.state.isDragging;
  readonly drawerRef = this.state.drawerRef;
  readonly overlayRef = this.state.overlayRef;
  readonly direction = this.state.direction;
  readonly hasBeenOpened = this.state.hasBeenOpened;
  readonly openTime = this.state.openTime;
  readonly shouldScaleBackground = this.state.shouldScaleBackground;
  readonly backgroundColorOnScale = this.state.backgroundColorOnScale;
  readonly noBodyStyles = this.state.noBodyStyles;
  readonly nested = this.state.nested;
  readonly modal = this.state.modal;
  readonly preventScrollRestoration = this.state.preventScrollRestoration;

  // ── Drag re-exports ───────────────────────────────────────────────────────
  readonly pointerStart = this.drag.pointerStart;
  readonly dragStartPosition = this.drag.dragStartPosition;
  readonly currentPointerPosition = this.drag.currentPointerPosition;
  readonly wasBeyondThePoint = this.drag.wasBeyondThePoint;
  readonly dragEndTime = this.drag.dragEndTime;
  readonly dragStartTime = this.drag.dragStartTime;
  readonly isAllowedToDrag = this.drag.isAllowedToDrag;

  // ── Snap re-exports ───────────────────────────────────────────────────────
  readonly snapPoints = this.snap.snapPoints;
  readonly activeSnapPoint = this.snap.activeSnapPoint;
  readonly fadeFromIndex = this.snap.fadeFromIndex;
  readonly snapToSequentialPoint = this.snap.snapToSequentialPoint;
  readonly activeSnapPointIndex = this.snap.activeSnapPointIndex;

  readonly drawerTransform = computed(() => {
    const drawer = this.drawerRef();
    if (!drawer) return null;
    const isDragging = this.isDragging();
    const offset = isDragging ? this.drag.calculateDragDelta() : 0;
    const direction = this.state.direction();
    return isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
  });

  constructor() {
    // Sync initial hide transform whenever the drawer element is first registered
    effect(() => {
      const drawer = this.drawerRef();
      if (!drawer || untracked(() => this.state.isOpen())) return;
      const direction = untracked(() => this.state.direction());
      const offset = this.dom.getTranslateBasedOnDirection({ drawer, direction });
      drawer.style.transform = isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
    });

    // Sync drawer position with open/close state changes
    effect(() => {
      const isOpen = this.isOpen();
      const drawer = untracked(() => this.state.drawerRef());
      if (!drawer) return;

      if (!isOpen) {
        const direction = untracked(() => this.state.direction());
        const offset = this.dom.getTranslateBasedOnDirection({ drawer, direction });
        drawer.style.transform = isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
      } else {
        const snapPoints = untracked(() => this.snap.snapPoints());
        if (snapPoints && snapPoints.length > 0) {
          const activePoint = untracked(() => this.snap.activeSnapPoint()) ?? snapPoints[0];
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
      const direction = this.state.direction();
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
  setOpenTime(date: Date | null): void {
    this.state.setOpenTime(date);
  }

  // ── Snap delegates ────────────────────────────────────────────────────────
  setSnapPoints(value: SnapPoint[] | null): void {
    this.snap.setSnapPoints(value);
  }
  setActiveSnapPoint(value: SnapPoint | null): void {
    this.snap.setActiveSnapPoint(value);
  }
  setFadeFromIndex(value: number | undefined): void {
    this.snap.setFadeFromIndex(value);
  }
  setSnapToSequentialPoint(value: boolean): void {
    this.snap.setSnapToSequentialPoint(value);
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

}
