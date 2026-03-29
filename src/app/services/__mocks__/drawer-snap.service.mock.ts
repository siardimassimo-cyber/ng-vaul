import { computed, signal } from '@angular/core';
import { SnapPoint } from '../../types';

export const createDrawerSnapMock = () => {
  const snapPoints = signal<SnapPoint[] | null>(null);
  const activeSnapPoint = signal<SnapPoint | null>(null);

  return {
    snapPoints,
    activeSnapPoint,
    fadeFromIndex: signal<number | undefined>(undefined),
    snapToSequentialPoint: signal<boolean>(false),

    activeSnapPointIndex: computed(() => {
      const sp = snapPoints();
      const asp = activeSnapPoint();
      if (!sp || asp === null) return null;
      return sp.indexOf(asp);
    }),

    getSnapPointsOffset: () => [],
    snapToPoint: (snapPoint: SnapPoint) => {},
    goToAdjacentSnap: (step: 1 | -1) => {},
    ngOnDestroy: () => {},
  };
};
