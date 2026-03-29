import { computed, signal } from '@angular/core';
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
  const isOpen = signal<boolean>(false);
  const isDragging = signal<boolean>(false);
  const drawerRef = signal<HTMLDivElement | null>(null);
  const overlayRef = signal<HTMLElement | null>(null);
  const direction = signal<DrawerDirectionType>(DrawerDirection.BOTTOM);
  const openTime = signal<Date | null>(null);
  const shouldScaleBackground = signal<boolean>(false);
  const backgroundColorOnScale = signal<boolean>(false);
  const noBodyStyles = signal<boolean>(false);
  const nested = signal<boolean>(false);
  const modal = signal<boolean>(false);
  const preventScrollRestoration = signal<boolean>(false);
  const hasBeenOpened = signal<boolean>(false);
  const stateChange = signal<void>(undefined);

  return {
    stateChange,
    isOpen,
    isDragging,
    drawerRef,
    overlayRef,
    direction,
    openTime,
    shouldScaleBackground,
    backgroundColorOnScale,
    noBodyStyles,
    nested,
    modal,
    preventScrollRestoration,
    hasBeenOpened,
    setIsOpen: vi.fn((v: boolean) => {
      if (v !== isOpen()) {
        isOpen.set(v);
        if (v) hasBeenOpened.set(true);
      }
    }),
    setIsDragging: vi.fn((v: boolean) => isDragging.set(v)),
    setDirection: vi.fn((v: DrawerDirectionType) => direction.set(v)),
    setDrawerRef: vi.fn((v: HTMLDivElement | null) => drawerRef.set(v)),
    setOverlayRef: vi.fn((v: HTMLElement | null) => overlayRef.set(v)),
    setScaleBackground: vi.fn((v: boolean) => shouldScaleBackground.set(v)),
    setBackgroundColor: vi.fn((v: boolean) => backgroundColorOnScale.set(v)),
    setNoBodyStyles: vi.fn((v: boolean) => noBodyStyles.set(v)),
    setNested: vi.fn((v: boolean) => nested.set(v)),
    setModal: vi.fn((v: boolean) => modal.set(v)),
    setHasBeenOpened: vi.fn((v: boolean) => hasBeenOpened.set(v)),
    setPreventScrollRestoration: vi.fn((v: boolean) => preventScrollRestoration.set(v)),
    setOpenTime: vi.fn((v: Date | null) => openTime.set(v)),
    getShouldScaleBackground: vi.fn(() => shouldScaleBackground()),
    getBackgroundColorOnScale: vi.fn(() => backgroundColorOnScale()),
    getNoBodyStyles: vi.fn(() => noBodyStyles()),
    getNested: vi.fn(() => nested()),
    getModal: vi.fn(() => modal()),
    getHasBeenOpened: vi.fn(() => hasBeenOpened()),
    getPreventScrollRestoration: vi.fn(() => preventScrollRestoration()),
  };
};

export const createDrawerSnapServiceMock = () => {
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
  const pointerStart = signal<{ x: number; y: number } | null>(null);
  const dragStartPosition = signal<{ x: number; y: number } | null>(null);
  const currentPointerPosition = signal<{ x: number; y: number } | null>(null);
  const wasBeyondThePoint = signal<boolean | null>(null);
  const dragEndTime = signal<Date | null>(null);
  const dragStartTime = signal<Date | null>(null);
  const isAllowedToDrag = signal<boolean>(false);

  return {
    pointerStart,
    dragStartPosition,
    currentPointerPosition,
    wasBeyondThePoint,
    dragEndTime,
    dragStartTime,
    isAllowedToDrag,
    calculateDragDelta: vi.fn((): number => 0),
    onPress: vi.fn(),
    onDrag: vi.fn(),
    onRelease: vi.fn(),
    shouldDrag: vi.fn((): boolean => true),
    resetDrawer: vi.fn(),
    closeDrawer: vi.fn(),
  };
};
