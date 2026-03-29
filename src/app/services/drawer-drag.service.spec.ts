import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DrawerDragService } from './drawer-drag.service';
import { DrawerStateService } from './drawer-state.service';
import { DrawerSnapService } from './drawer-snap.service';
import { DrawerDomService } from './drawer-dom.service';
import { DrawerDirection } from '../types';
import { DRAG_CLASS } from './constants';
import {
  createDrawerDomServiceMock,
  createDrawerSnapServiceMock,
  createDrawerStateServiceMock,
  createMockHTMLElement,
  dispatchPointerEventOn,
  setupDrawerDOM,
} from './__mocks__/dom-helpers.mock';

describe('DrawerDragService', () => {
  let service: DrawerDragService;

  const stateMock = createDrawerStateServiceMock();
  const snapMock = createDrawerSnapServiceMock();
  const domMock = createDrawerDomServiceMock();

  let mockDrawer: HTMLDivElement;
  let domSetup: ReturnType<typeof setupDrawerDOM>;

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [
        DrawerDragService,
        { provide: DrawerStateService, useValue: stateMock },
        { provide: DrawerSnapService, useValue: snapMock },
        { provide: DrawerDomService, useValue: domMock },
      ],
    });
    service = TestBed.inject(DrawerDragService);
  });

  beforeEach(() => {
    mockDrawer = createMockHTMLElement();
    domSetup = setupDrawerDOM();
    stateMock.isOpen.set(false);
    stateMock.isDragging.set(false);
    stateMock.drawerRef.set(null);
    stateMock.overlayRef.set(null);
    stateMock.direction.set(DrawerDirection.BOTTOM);
    stateMock.openTime.set(null);
    snapMock.snapPoints.set(null);
    snapMock.activeSnapPoint.set(null);
    service.dragStartPosition.set(null);
    service.pointerStart.set(null);
    service.dragEndTime.set(null);
    service.dragStartTime.set(null);
    service.isAllowedToDrag.set(false);
    service.currentPointerPosition.set(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    domSetup.cleanup();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with null drag start position', () => {
      expect(service.dragStartPosition()).toBeNull();
    });

    it('should start with null pointer start', () => {
      expect(service.pointerStart()).toBeNull();
    });

    it('should start not allowed to drag', () => {
      expect(service.isAllowedToDrag()).toBe(false);
    });
  });

  describe('calculateDragDelta', () => {
    it('should return 0 when start position is null', () => {
      expect(service.calculateDragDelta()).toBe(0);
    });

    it('should return 0 when current position is null', () => {
      service.dragStartPosition.set({ x: 100, y: 200 });
      expect(service.calculateDragDelta()).toBe(0);
    });

    it('should calculate vertical delta for BOTTOM direction', () => {
      stateMock.direction.set(DrawerDirection.BOTTOM);
      service.dragStartPosition.set({ x: 100, y: 200 });
      service.currentPointerPosition.set({ x: 100, y: 350 });

      expect(service.calculateDragDelta()).toBe(150);
    });

    it('should calculate horizontal delta for RIGHT direction', () => {
      stateMock.direction.set(DrawerDirection.RIGHT);
      service.dragStartPosition.set({ x: 100, y: 200 });
      service.currentPointerPosition.set({ x: 250, y: 200 });

      expect(service.calculateDragDelta()).toBe(150);
    });

    it('should return negative delta when dragging in closing direction', () => {
      stateMock.direction.set(DrawerDirection.BOTTOM);
      service.dragStartPosition.set({ x: 100, y: 300 });
      service.currentPointerPosition.set({ x: 100, y: 100 });

      expect(service.calculateDragDelta()).toBe(-200);
    });
  });

  describe('onPress', () => {
    it('should do nothing when element is not provided', () => {
      service.onPress(dispatchPointerEventOn(mockDrawer, { clientX: 100, clientY: 200 }));
      expect(service.dragStartPosition()).toBeNull();
    });

    it('should set the drag start position', () => {
      service.onPress(dispatchPointerEventOn(mockDrawer, { clientX: 100, clientY: 200 }), mockDrawer);
      expect(service.dragStartPosition()).toEqual({ x: 100, y: 200 });
    });

    it('should capture the pointer on the element', () => {
      service.onPress(dispatchPointerEventOn(mockDrawer, { pointerId: 5 }), mockDrawer);
      expect(mockDrawer.setPointerCapture).toHaveBeenCalledWith(5);
    });

    it('should set the current pointer position', () => {
      service.onPress(dispatchPointerEventOn(mockDrawer, { clientX: 150, clientY: 250 }), mockDrawer);
      expect(service.currentPointerPosition()).toEqual({ x: 150, y: 250 });
    });
  });

  describe('onDrag', () => {
    it('should do nothing when element is not provided', () => {
      service.onDrag(new PointerEvent('pointermove', { clientX: 200, clientY: 300 }));
      expect(service.currentPointerPosition()).toBeNull();
    });

    it('should update the current pointer position', () => {
      stateMock.isDragging.set(true);
      service.isAllowedToDrag.set(true);
      const event = dispatchPointerEventOn(mockDrawer, { clientX: 200, clientY: 300, buttons: 1 });
      service.onDrag(event, mockDrawer);
      expect(service.currentPointerPosition()).toEqual({ x: 200, y: 300 });
    });

    it('should stop drag and call onRelease when buttons are 0', () => {
      stateMock.isDragging.set(true);
      const event = new PointerEvent('pointermove', { buttons: 0 });

      service.onDrag(event, mockDrawer);

      expect(stateMock.setIsDragging).toHaveBeenCalledWith(false);
    });

    it('should apply the drag transform when dragging is active', () => {
      stateMock.direction.set(DrawerDirection.BOTTOM);
      stateMock.isDragging.set(true);
      service.dragStartPosition.set({ x: 0, y: 0 });
      service.pointerStart.set({ x: 0, y: 0 });
      service.isAllowedToDrag.set(true);

      const event = dispatchPointerEventOn(mockDrawer, { clientX: 0, clientY: 100, buttons: 1 });
      service.onDrag(event, mockDrawer, true);

      expect(mockDrawer.style.transform).toContain('translate3d');
    });
  });

  describe('onRelease', () => {
    it('should do nothing when element is not provided', () => {
      service.onRelease(new PointerEvent('pointerup'), DrawerDirection.BOTTOM);
      expect(service.dragEndTime()).toBeNull();
    });

    it('should do nothing when event is null', () => {
      service.onRelease(null, DrawerDirection.BOTTOM, mockDrawer);
      expect(service.dragEndTime()).toBeNull();
    });

    it('should clear pointer start on release', () => {
      service.pointerStart.set({ x: 100, y: 200 });
      service.onRelease(new PointerEvent('pointerup'), DrawerDirection.BOTTOM, mockDrawer);
      expect(service.pointerStart()).toBeNull();
    });

    it('should do nothing when not dragging', () => {
      stateMock.isDragging.set(false);
      service.onRelease(new PointerEvent('pointerup'), DrawerDirection.BOTTOM, mockDrawer);
      expect(service.dragEndTime()).toBeNull();
    });

    it('should set isDragging to false on release', () => {
      stateMock.isDragging.set(true);
      service.dragStartPosition.set({ x: 0, y: 0 });

      service.onRelease(new PointerEvent('pointerup', { clientX: 0, clientY: 0 }), DrawerDirection.BOTTOM, mockDrawer);

      expect(stateMock.setIsDragging).toHaveBeenCalledWith(false);
    });

    it('should record drag end time', () => {
      stateMock.isDragging.set(true);
      service.dragStartPosition.set({ x: 0, y: 0 });

      const before = Date.now();
      service.onRelease(new PointerEvent('pointerup', { clientX: 0, clientY: 0 }), DrawerDirection.BOTTOM, mockDrawer);
      const after = Date.now();

      expect(service.dragEndTime()).toBeTruthy();
      expect(service.dragEndTime()!.getTime()).toBeGreaterThanOrEqual(before);
      expect(service.dragEndTime()!.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('shouldDrag', () => {
    it('should not allow drag on SELECT element', () => {
      expect(service.shouldDrag(document.createElement('select'), false)).toBe(false);
    });

    it('should not allow drag on element with data-vaul-no-drag attribute', () => {
      const el = document.createElement('div');
      el.setAttribute('data-vaul-no-drag', '');
      expect(service.shouldDrag(el, false)).toBe(false);
    });

    it('should allow drag on a dialog scrolled to the top', () => {
      const el = document.createElement('div');
      el.setAttribute('role', 'dialog');
      Object.defineProperty(el, 'scrollHeight', { value: 1000 });
      Object.defineProperty(el, 'clientHeight', { value: 500 });
      Object.defineProperty(el, 'scrollTop', { value: 0 });
      expect(service.shouldDrag(el, false)).toBe(true);
    });

    it('should not allow drag when dialog is scrolled down', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollHeight', { value: 1000 });
      Object.defineProperty(el, 'clientHeight', { value: 500 });
      Object.defineProperty(el, 'scrollTop', { value: 10 });
      expect(service.shouldDrag(el, false)).toBe(false);
    });

    it('should allow drag on a plain div', () => {
      expect(service.shouldDrag(document.createElement('div'), false)).toBe(true);
    });

    it('should not allow drag on TEXTAREA when scrolled', () => {
      const el = document.createElement('textarea');
      Object.defineProperty(el, 'scrollHeight', { value: 1000 });
      Object.defineProperty(el, 'clientHeight', { value: 500 });
      Object.defineProperty(el, 'scrollTop', { value: 100 });
      expect(service.shouldDrag(el, false)).toBe(false);
    });

    it('should allow drag on TEXTAREA at the top', () => {
      const el = document.createElement('textarea');
      Object.defineProperty(el, 'scrollHeight', { value: 100 });
      Object.defineProperty(el, 'clientHeight', { value: 100 });
      Object.defineProperty(el, 'scrollTop', { value: 0 });
      expect(service.shouldDrag(el, false)).toBe(true);
    });
  });

  describe('resetDrawer', () => {
    it('should call setIsDragging(false)', () => {
      service.resetDrawer(DrawerDirection.BOTTOM, mockDrawer);
      expect(stateMock.setIsDragging).toHaveBeenCalledWith(false);
    });

    it('should reset element transform to translate3d(0,0,0) when no active snap point', () => {
      snapMock.activeSnapPoint.set(null);
      service.resetDrawer(DrawerDirection.BOTTOM, mockDrawer);
      expect(mockDrawer.style.transform).toContain('translate3d(0, 0, 0)');
    });

    it('should call snapToPoint when there is an active snap point', () => {
      snapMock.activeSnapPoint.set(0.5);
      service.resetDrawer(DrawerDirection.BOTTOM, mockDrawer);
      expect(snapMock.snapToPoint).toHaveBeenCalledWith(0.5);
    });
  });

  describe('closeDrawer', () => {
    it('should call setIsOpen(false)', () => {
      service.closeDrawer(mockDrawer);
      expect(stateMock.setIsOpen).toHaveBeenCalledWith(false);
    });

    it('should remove DRAG_CLASS and call setIsDragging(false) when dragging', () => {
      mockDrawer.classList.add(DRAG_CLASS);
      stateMock.isDragging.set(true);

      service.closeDrawer(mockDrawer);

      expect(mockDrawer.classList.contains(DRAG_CLASS)).toBe(false);
      expect(stateMock.setIsDragging).toHaveBeenCalledWith(false);
    });
  });
});
