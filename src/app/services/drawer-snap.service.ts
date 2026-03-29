import { computed, inject, Injectable, signal } from '@angular/core';
import { DrawerDirection, SnapPoint } from '../types';
import { TRANSITIONS } from './constants';
import { isVertical, set } from '../utils/helpers';
import { DrawerStateService } from './drawer-state.service';

@Injectable({ providedIn: 'root' })
export class DrawerSnapService {
  private readonly state = inject(DrawerStateService);

  readonly snapPoints = signal<SnapPoint[] | null>(null);
  readonly activeSnapPoint = signal<SnapPoint | null>(null);
  readonly fadeFromIndex = signal<number | undefined>(undefined);
  readonly snapToSequentialPoint = signal<boolean>(false);

  readonly activeSnapPointIndex = computed(() => {
    const snapPoints = this.snapPoints();
    const activeSnapPoint = this.activeSnapPoint();
    if (!snapPoints || activeSnapPoint === null) return null;
    return snapPoints.indexOf(activeSnapPoint);
  });

  setSnapPoints(value: SnapPoint[] | null): void {
    this.snapPoints.set(value);
  }

  setActiveSnapPoint(value: SnapPoint | null): void {
    this.activeSnapPoint.set(value);
  }

  setFadeFromIndex(value: number | undefined): void {
    this.fadeFromIndex.set(value);
  }

  setSnapToSequentialPoint(value: boolean): void {
    this.snapToSequentialPoint.set(value);
  }

  getSnapPointsOffset(): number[] {
    const snapPoints = this.snapPoints();
    const drawer = this.state.drawerRef();
    const direction = this.state.direction();
    if (!snapPoints || !drawer) return [];

    const rect = drawer.getBoundingClientRect();
    const drawerSize = isVertical(direction) ? rect.height : rect.width;

    return snapPoints.map((snapPoint) => {
      const isPx = typeof snapPoint === 'string';
      const snapPointAsNumber = isPx ? parseInt(snapPoint as string, 10) : (snapPoint as number) * drawerSize;

      if (isVertical(direction)) {
        return direction === DrawerDirection.BOTTOM ? drawerSize - snapPointAsNumber : -drawerSize + snapPointAsNumber;
      } else {
        return direction === DrawerDirection.RIGHT ? drawerSize - snapPointAsNumber : -drawerSize + snapPointAsNumber;
      }
    });
  }

  snapToPoint(snapPoint: SnapPoint): void {
    const drawer = this.state.drawerRef();
    const direction = this.state.direction();
    if (!drawer) return;

    const index = this.snapPoints()?.indexOf(snapPoint) ?? -1;
    if (index === -1) return;

    const offset = this.getSnapPointsOffset()[index];
    this.activeSnapPoint.set(snapPoint);

    set(drawer, {
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      transform: isVertical(direction) ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)`,
    });

    const fadeFromIndex = this.fadeFromIndex();
    const overlay = this.state.overlayRef();
    if (overlay && fadeFromIndex !== undefined) {
      set(overlay, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        opacity: index < fadeFromIndex ? '0' : '1',
      });
    }
  }

  /** Moves the active snap by one step (used for a11y / automation when pointer-drag is unavailable). */
  goToAdjacentSnap(step: 1 | -1): void {
    if (!this.state.isOpen()) return;
    const snapPoints = this.snapPoints();
    if (!snapPoints?.length) return;

    const current = this.activeSnapPoint() ?? snapPoints[0];
    const i = snapPoints.indexOf(current);
    if (i === -1) return;

    const j = i + step;
    if (j < 0 || j >= snapPoints.length) return;
    this.snapToPoint(snapPoints[j]);
  }

  ngOnDestroy(): void {
    // Signals clean up automatically; method kept for backward compatibility
  }
}
