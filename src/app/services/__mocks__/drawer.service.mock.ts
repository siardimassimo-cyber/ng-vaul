import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { DrawerDirection, DrawerDirectionType, SnapPoint } from '../../types';

export const createDrawerServiceMock = () => ({
  // State re-exports
  stateChange$: new BehaviorSubject<void>(undefined),
  isOpen$: new BehaviorSubject<boolean>(false),
  isDragging$: new BehaviorSubject<boolean>(false),
  isDraggingObs$: new BehaviorSubject<boolean>(false).asObservable(),
  drawerRef$: new BehaviorSubject<HTMLDivElement | null>(null),
  drawerRefObs$: new BehaviorSubject<HTMLDivElement | null>(null).asObservable(),
  overlayRef$: new BehaviorSubject<HTMLElement | null>(null),
  direction$: new BehaviorSubject<DrawerDirectionType>(DrawerDirection.BOTTOM),
  hasBeenOpened$: new BehaviorSubject<boolean>(false),
  openTime$: new BehaviorSubject<Date | null>(null),
  shouldScaleBackground$: new BehaviorSubject<boolean>(false),
  setBackgroundColorOnScale$: new BehaviorSubject<boolean>(false),
  noBodyStyles$: new BehaviorSubject<boolean>(false),
  nested$: new BehaviorSubject<boolean>(false),
  modal$: new BehaviorSubject<boolean>(false),
  preventScrollRestoration$: new BehaviorSubject<boolean>(false),

  // Drag re-exports
  pointerStart$: new BehaviorSubject<{ x: number; y: number } | null>(null),
  dragStartPosition$: new BehaviorSubject<{ x: number; y: number } | null>(null),
  currentPointerPositionObs$: new BehaviorSubject<{ x: number; y: number } | null>(null).asObservable(),
  wasBeyondThePoint$: new BehaviorSubject<boolean | null>(null),
  dragEndTime$: new BehaviorSubject<Date | null>(null),
  dragStartTime$: new BehaviorSubject<Date | null>(null),
  isAllowedToDrag$: new BehaviorSubject<boolean>(false),

  // Snap re-exports
  snapPoints$: new BehaviorSubject<SnapPoint[] | null>(null),
  activeSnapPoint$: new BehaviorSubject<SnapPoint | null>(null),
  fadeFromIndex$: new BehaviorSubject<number | undefined>(undefined),
  snapToSequentialPoint$: new BehaviorSubject<boolean>(false),
  activeSnapPointIndex$: new Observable<number | null>(),

  drawerTransform$: new Observable<string | null>(),

  // State delegates
  setIsOpen: (isOpen: boolean): void => {
    // implementation
  },
  setIsDragging: (isDragging: boolean): void => {
    // implementation
  },
  setDirection: (direction: DrawerDirectionType): void => {
    // implementation
  },
  setDrawerRef: (ref: HTMLDivElement | null): void => {
    // implementation
  },
  setOverlayRef: (ref: HTMLElement | null): void => {
    // implementation
  },
  setScaleBackground: (value: boolean): void => {
    // implementation
  },
  setBackgroundColor: (value: boolean): void => {
    // implementation
  },
  setNoBodyStyles: (value: boolean): void => {
    // implementation
  },
  setNested: (value: boolean): void => {
    // implementation
  },
  setModal: (value: boolean): void => {
    // implementation
  },
  setHasBeenOpened: (value: boolean): void => {
    // implementation
  },
  setPreventScrollRestoration: (value: boolean): void => {
    // implementation
  },
  shouldScaleBackground: (): boolean => false,
  setBackgroundColorOnScale: (): boolean => false,
  noBodyStyles: (): boolean => false,
  nested: (): boolean => false,
  modal: (): boolean => false,
  hasBeenOpened: (): boolean => false,
  preventScrollRestoration: (): boolean => false,

  // Drag delegates
  onPress: (event: PointerEvent, element?: HTMLDivElement): void => {
    // implementation
  },
  onDrag: (event: DragEvent | PointerEvent, element?: HTMLDivElement, dismissible?: boolean): void => {
    // implementation
  },
  onRelease: (event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement): void => {
    // implementation
  },
  shouldDrag: (el: EventTarget, isDraggingInDirection: boolean): boolean => false,
  resetDrawer: (direction: DrawerDirectionType, element?: HTMLDivElement): void => {
    // implementation
  },
  closeDrawer: (drawer: HTMLDivElement): void => {
    // implementation
  },

  // Snap delegates
  getSnapPointsOffset: (): number[] => [],
  goToAdjacentSnap: (step: 1 | -1): void => {
    // implementation
  },

  // DOM delegates
  getTranslateBasedOnDirection: ({
    drawer,
    direction,
  }: {
    drawer: HTMLDivElement;
    direction: DrawerDirectionType;
  }): number => 0,
  getScale: (): number => 0.974,

  ngOnDestroy: (): void => {
    // implementation
  },
});
