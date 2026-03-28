import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { DrawerDirection, SnapPoint } from '../types';
import { TRANSITIONS } from './constants';
import { isVertical, set } from '../utils/helpers';
import { DrawerStateService } from './drawer-state.service';

@Injectable({ providedIn: 'root' })
export class DrawerSnapService {
  private readonly state = inject(DrawerStateService);

  readonly snapPoints$ = new BehaviorSubject<SnapPoint[] | null>(null);
  readonly activeSnapPoint$ = new BehaviorSubject<SnapPoint | null>(null);
  readonly fadeFromIndex$ = new BehaviorSubject<number | undefined>(undefined);
  readonly snapToSequentialPoint$ = new BehaviorSubject<boolean>(false);

  readonly activeSnapPointIndex$ = combineLatest([this.snapPoints$, this.activeSnapPoint$]).pipe(
    map(([snapPoints, activeSnapPoint]) => {
      if (!snapPoints || activeSnapPoint === null) return null;
      return snapPoints.indexOf(activeSnapPoint);
    }),
  );

  getSnapPointsOffset(): number[] {
    const snapPoints = this.snapPoints$.value;
    const drawer = this.state.drawerRef$.value;
    const direction = this.state.direction$.value;
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
    const drawer = this.state.drawerRef$.value;
    const direction = this.state.direction$.value;
    if (!drawer) return;

    const index = this.snapPoints$.value?.indexOf(snapPoint) ?? -1;
    if (index === -1) return;

    const offset = this.getSnapPointsOffset()[index];
    this.activeSnapPoint$.next(snapPoint);

    set(drawer, {
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      transform: isVertical(direction) ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)`,
    });

    const fadeFromIndex = this.fadeFromIndex$.value;
    const overlay = this.state.overlayRef$.value;
    if (overlay && fadeFromIndex !== undefined) {
      set(overlay, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        opacity: index < fadeFromIndex ? '0' : '1',
      });
    }
  }

  /** Moves the active snap by one step (used for a11y / automation when pointer-drag is unavailable). */
  goToAdjacentSnap(step: 1 | -1): void {
    if (!this.state.isOpen$.value) return;
    const snapPoints = this.snapPoints$.value;
    if (!snapPoints?.length) return;

    const current = this.activeSnapPoint$.value ?? snapPoints[0];
    const i = snapPoints.indexOf(current);
    if (i === -1) return;

    const j = i + step;
    if (j < 0 || j >= snapPoints.length) return;
    this.snapToPoint(snapPoints[j]);
  }

  ngOnDestroy(): void {
    this.snapPoints$.complete();
    this.activeSnapPoint$.complete();
    this.fadeFromIndex$.complete();
    this.snapToSequentialPoint$.complete();
  }
}
