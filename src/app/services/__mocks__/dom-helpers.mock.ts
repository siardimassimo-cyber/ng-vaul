import { BehaviorSubject, Observable } from 'rxjs';
import { vi } from 'vitest';
import { DrawerDirection, DrawerDirectionType, SnapPoint } from '../../types';

export const createMockHTMLElement = ({ offsetHeight = 500, offsetWidth = 300 } = {}): HTMLDivElement => {
  const element = document.createElement('div') as HTMLDivElement;
  Object.defineProperty(element, 'offsetHeight', { value: offsetHeight, writable: true });
  Object.defineProperty(element, 'offsetWidth', { value: offsetWidth, writable: true });
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({ height: offsetHeight, width: offsetWidth, top: 0, left: 0, right: offsetWidth, bottom: offsetHeight }),
  });
  element.setPointerCapture = vi.fn();
  element.releasePointerCapture = vi.fn();
  return element;
};

export const createMockPointerEvent = (options: Partial<PointerEventInit> = {}) =>
  new PointerEvent('pointermove', { clientX: 0, clientY: 0, pointerId: 1, ...options });

export const createMockDragEvent = (options: Partial<DragEventInit> = {}) =>
  new DragEvent('drag', { clientX: 0, clientY: 0, ...options });

export const dispatchPointerEventOn = (element: HTMLElement, options: Partial<PointerEventInit> = {}): PointerEvent => {
  let capturedEvent!: PointerEvent;
  element.addEventListener('pointerdown', (e) => { capturedEvent = e as PointerEvent; }, { once: true });
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0, pointerId: 1, ...options }));
  return capturedEvent;
};

export const setupDrawerDOM = () => {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-vaul-drawer-wrapper', '');
  document.body.appendChild(wrapper);
  return {
    wrapper,
    cleanup: () => {
      if (wrapper.parentNode) document.body.removeChild(wrapper);
    },
  };
};

export const createDrawerStateServiceMock = () => {
  const isOpen$ = new BehaviorSubject<boolean>(false);
  const isDragging$ = new BehaviorSubject<boolean>(false);
  const drawerRef$ = new BehaviorSubject<HTMLDivElement | null>(null);
  const overlayRef$ = new BehaviorSubject<HTMLElement | null>(null);
  const direction$ = new BehaviorSubject<DrawerDirectionType>(DrawerDirection.BOTTOM);
  const openTime$ = new BehaviorSubject<Date | null>(null);
  const shouldScaleBackground$ = new BehaviorSubject<boolean>(false);
  const setBackgroundColorOnScale$ = new BehaviorSubject<boolean>(false);
  const noBodyStyles$ = new BehaviorSubject<boolean>(false);
  const nested$ = new BehaviorSubject<boolean>(false);
  const modal$ = new BehaviorSubject<boolean>(false);
  const preventScrollRestoration$ = new BehaviorSubject<boolean>(false);
  const hasBeenOpened$ = new BehaviorSubject<boolean>(false);
  const stateChange$ = new BehaviorSubject<void>(undefined);

  return {
    stateChange$,
    isOpen$,
    isDragging$,
    drawerRef$,
    overlayRef$,
    direction$,
    openTime$,
    shouldScaleBackground$,
    setBackgroundColorOnScale$,
    noBodyStyles$,
    nested$,
    modal$,
    preventScrollRestoration$,
    hasBeenOpened$,
    setIsOpen: vi.fn((v: boolean) => {
      if (v !== isOpen$.value) {
        isOpen$.next(v);
        if (v) hasBeenOpened$.next(true);
      }
    }),
    setIsDragging: vi.fn((v: boolean) => isDragging$.next(v)),
    setDirection: vi.fn((v: DrawerDirectionType) => direction$.next(v)),
    setDrawerRef: vi.fn((v: HTMLDivElement | null) => drawerRef$.next(v)),
    setOverlayRef: vi.fn((v: HTMLElement | null) => overlayRef$.next(v)),
    setScaleBackground: vi.fn((v: boolean) => shouldScaleBackground$.next(v)),
    setBackgroundColor: vi.fn((v: boolean) => setBackgroundColorOnScale$.next(v)),
    setNoBodyStyles: vi.fn((v: boolean) => noBodyStyles$.next(v)),
    setNested: vi.fn((v: boolean) => nested$.next(v)),
    setModal: vi.fn((v: boolean) => modal$.next(v)),
    setHasBeenOpened: vi.fn((v: boolean) => hasBeenOpened$.next(v)),
    setPreventScrollRestoration: vi.fn((v: boolean) => preventScrollRestoration$.next(v)),
    getShouldScaleBackground: vi.fn(() => shouldScaleBackground$.value),
    getBackgroundColorOnScale: vi.fn(() => setBackgroundColorOnScale$.value),
    getNoBodyStyles: vi.fn(() => noBodyStyles$.value),
    getNested: vi.fn(() => nested$.value),
    getModal: vi.fn(() => modal$.value),
    getHasBeenOpened: vi.fn(() => hasBeenOpened$.value),
    getPreventScrollRestoration: vi.fn(() => preventScrollRestoration$.value),
  };
};

export const createDrawerSnapServiceMock = () => {
  const snapPoints$ = new BehaviorSubject<SnapPoint[] | null>(null);
  const activeSnapPoint$ = new BehaviorSubject<SnapPoint | null>(null);

  return {
    snapPoints$,
    activeSnapPoint$,
    fadeFromIndex$: new BehaviorSubject<number | undefined>(undefined),
    snapToSequentialPoint$: new BehaviorSubject<boolean>(false),
    activeSnapPointIndex$: new Observable<number | null>(),
    getSnapPointsOffset: vi.fn((): number[] => []),
    snapToPoint: vi.fn(),
    goToAdjacentSnap: vi.fn(),
  };
};

export const createDrawerDomServiceMock = () => ({
  getWrapperElement: vi.fn((): HTMLElement | null => null),
  getTranslate: vi.fn((_element: HTMLElement, _direction: DrawerDirectionType): number | null => null),
  getTranslateBasedOnDirection: vi.fn((): number => 0),
  getScale: vi.fn((): number => 0.974),
});

export const createDrawerDragServiceMock = () => {
  const pointerStart$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  const dragStartPosition$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  const wasBeyondThePoint$ = new BehaviorSubject<boolean | null>(null);
  const dragEndTime$ = new BehaviorSubject<Date | null>(null);
  const dragStartTime$ = new BehaviorSubject<Date | null>(null);
  const isAllowedToDrag$ = new BehaviorSubject<boolean>(false);

  return {
    pointerStart$,
    dragStartPosition$,
    currentPointerPositionObs$: new Observable<{ x: number; y: number } | null>(),
    wasBeyondThePoint$,
    dragEndTime$,
    dragStartTime$,
    isAllowedToDrag$,
    calculateDragDelta: vi.fn((): number => 0),
    onPress: vi.fn(),
    onDrag: vi.fn(),
    onRelease: vi.fn(),
    shouldDrag: vi.fn((): boolean => true),
    resetDrawer: vi.fn(),
    closeDrawer: vi.fn(),
  };
};
