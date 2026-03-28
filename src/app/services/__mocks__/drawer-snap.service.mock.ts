import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { SnapPoint } from '../../types';

export const createDrawerSnapMock = () => ({
  snapPoints$: new BehaviorSubject<SnapPoint[] | null>(null),
  activeSnapPoint$: new BehaviorSubject<SnapPoint | null>(null),
  fadeFromIndex$: new BehaviorSubject<number | undefined>(undefined),
  snapToSequentialPoint$: new BehaviorSubject<boolean>(false),

  activeSnapPointIndex$: combineLatest([
    new BehaviorSubject<SnapPoint[] | null>(null),
    new BehaviorSubject<SnapPoint | null>(null),
  ]).pipe(
    map(([snapPoints, activeSnapPoint]) => {
      if (!snapPoints || activeSnapPoint === null) return null;
      return snapPoints.indexOf(activeSnapPoint);
    }),
  ),

  getSnapPointsOffset: () => [],
  snapToPoint: (snapPoint: SnapPoint) => {
    // implementation
  },
  goToAdjacentSnap: (step: 1 | -1) => {
    // implementation
  },
  ngOnDestroy: () => {
    // implementation
  },
});
