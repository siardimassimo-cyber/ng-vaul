import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DrawerService } from './drawer.service';
import { DrawerDirection } from '../types';
import { DRAG_CLASS } from './constants';

describe('DrawerService', () => {
  let service: DrawerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DrawerService]
    });
    service = TestBed.inject(DrawerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state as closed', () => {
    expect(service.isOpen$.value).toBe(false);
  });

  it('should set direction correctly', () => {
    service.setDirection(DrawerDirection.LEFT);
    expect(service.direction$.value).toBe(DrawerDirection.LEFT);
  });

  it('should toggle open/close state', () => {
    service.setIsOpen(true);
    expect(service.isOpen$.value).toBe(true);
    expect(service.hasBeenOpened$.value).toBe(true);
    service.setIsOpen(false);
    expect(service.isOpen$.value).toBe(false);
  });

  it('should set dragging state', () => {
    service.setIsDragging(true);
    expect(service.isDragging$.value).toBe(true);
    service.setIsDragging(false);
    expect(service.isDragging$.value).toBe(false);
  });

  it('should set drawer ref and initial transform', () => {
    const mockDrawer = {
      getBoundingClientRect: () => ({ height: 500, width: 300 }),
      style: { transform: '' }
    } as any;
    service.setDirection(DrawerDirection.BOTTOM);
    service.setDrawerRef(mockDrawer);
    expect(service.drawerRef$.value).toBe(mockDrawer);
    expect(mockDrawer.style.transform).toBe('translateY(500px)');
  });

  it('should set overlay ref', () => {
    const mockOverlay = {} as any;
    service.setOverlayRef(mockOverlay);
    expect(service.overlayRef$.value).toBe(mockOverlay);
  });

  describe('Snap Points', () => {
    it('should calculate percentage offsets for BOTTOM direction', () => {
      const mockDrawer = {
        getBoundingClientRect: () => ({ height: 500, width: 300 }),
        style: {}
      } as any;
      service.setDrawerRef(mockDrawer);
      service.setDirection(DrawerDirection.BOTTOM);
      service.snapPoints$.next([0.5, 1]);

      const offsets = service.getSnapPointsOffset();
      expect(offsets).toEqual([250, 0]);
    });

    it('should calculate pixel offsets for RIGHT direction', () => {
      const mockDrawer = {
        getBoundingClientRect: () => ({ height: 500, width: 400 }),
        style: {}
      } as any;
      service.setDrawerRef(mockDrawer);
      service.setDirection(DrawerDirection.RIGHT);
      service.snapPoints$.next(['100px', '300px']);

      const offsets = service.getSnapPointsOffset();
      expect(offsets).toEqual([300, 100]);
    });

    it('should return empty offsets if no snap points or drawer', () => {
      expect(service.getSnapPointsOffset()).toEqual([]);
      service.snapPoints$.next([0.5]);
      expect(service.getSnapPointsOffset()).toEqual([]);
    });
  });

  describe('Getters and Setters for Flags', () => {
    it('should manage shouldScaleBackground', () => {
      service.setScaleBackground(true);
      expect(service.shouldScaleBackground()).toBe(true);
      service.setScaleBackground(false);
      expect(service.shouldScaleBackground()).toBe(false);
    });

    it('should manage setBackgroundColor', () => {
      service.setBackgroundColor(true);
      expect(service.setBackgroundColorOnScale()).toBe(true);
    });

    it('should manage setNoBodyStyles', () => {
      service.setNoBodyStyles(true);
      expect(service.noBodyStyles()).toBe(true);
    });

    it('should manage nested', () => {
      service.setNested(true);
      expect(service.nested()).toBe(true);
    });

    it('should manage modal', () => {
      service.setModal(true);
      expect(service.modal()).toBe(true);
    });

    it('should manage hasBeenOpened', () => {
      service.setHasBeenOpened(true);
      expect(service.hasBeenOpened()).toBe(true);
    });

    it('should manage preventScrollRestoration', () => {
      service.setPreventScrollRestoration(true);
      expect(service.preventScrollRestoration()).toBe(true);
    });
  });

  describe('Event Handlers', () => {
    it('should handle onPress', () => {
      const mockElement = document.createElement('div');
      const event = {
        clientX: 100,
        clientY: 200,
        pointerId: 1,
        target: mockElement
      } as any;
      
      mockElement.setPointerCapture = vi.fn();
      
      service.onPress(event, mockElement);
      
      expect(service.dragStartPosition$.value).toEqual({ x: 100, y: 200 });
      expect(mockElement.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('should handle onDrag when dragging', () => {
      const mockElement = document.createElement('div');
      const mockWrapper = document.createElement('div');
      mockWrapper.setAttribute('data-vaul-drawer-wrapper', '');
      document.body.appendChild(mockWrapper);
      
      service.setDirection(DrawerDirection.BOTTOM);
      service.setIsDragging(true);
      service.dragStartPosition$.next({ x: 0, y: 0 });
      service.pointerStart$.next({ x: 0, y: 0 });
      service.isAllowedToDrag$.next(true);

      const event = { clientX: 0, clientY: 100, target: mockElement } as any;
      service.onDrag(event, mockElement);

      expect(service.currentPointerPositionObs$).toBeDefined();
      expect(mockElement.style.transform).toContain('translate3d(0, 100px, 0)');
      
      document.body.removeChild(mockWrapper);
    });

    it('should terminate drag onDrag if buttons are 0', () => {
      const mockElement = document.createElement('div');
      service.setIsDragging(true);
      const spy = vi.spyOn(service, 'onRelease');
      
      const event = new PointerEvent('pointermove', { buttons: 0 });
      service.onDrag(event, mockElement);
      
      expect(spy).toHaveBeenCalled();
    });

    it('should handle onRelease with high velocity', () => {
      const mockElement = document.createElement('div');
      Object.defineProperty(mockElement, 'offsetHeight', { value: 500 });
      
      service.setDirection(DrawerDirection.BOTTOM);
      service.setIsDragging(true);
      service.dragStartTime$.next(new Date(Date.now() - 50)); // 50ms ago
      service.dragStartPosition$.next({ x: 0, y: 0 });
      
      const event = { clientX: 0, clientY: 100 } as any; // Moved 100px
      const snapSpy = vi.spyOn(service as any, 'snapToPoint');
      
      service.snapPoints$.next([0.5, 1]); // Snap points at 250px and 0px offset
      service.activeSnapPoint$.next(0.5);
      
      // Velocity = 100 / 50 = 2.0 (Threshold is 0.4)
      service.onRelease(event, DrawerDirection.BOTTOM, mockElement);
      
      expect(service.isDragging$.value).toBe(false);
      expect(snapSpy).toHaveBeenCalled();
    });
  });

  describe('shouldDrag Logic', () => {
    it('should not drag if element is a SELECT', () => {
      const el = document.createElement('select');
      expect(service.shouldDrag(el, false)).toBe(false);
    });

    it('should not drag if element has data-vaul-no-drag', () => {
      const el = document.createElement('div');
      el.setAttribute('data-vaul-no-drag', '');
      expect(service.shouldDrag(el, false)).toBe(false);
    });

    it('should drag if element is a dialog and scrolled to top', () => {
      const el = document.createElement('div');
      el.setAttribute('role', 'dialog');
      Object.defineProperty(el, 'scrollHeight', { value: 1000 });
      Object.defineProperty(el, 'clientHeight', { value: 500 });
      Object.defineProperty(el, 'scrollTop', { value: 0 });

      expect(service.shouldDrag(el, false)).toBe(true);
    });

    it('should not drag if element is scrolled down', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollHeight', { value: 1000 });
      Object.defineProperty(el, 'clientHeight', { value: 500 });
      Object.defineProperty(el, 'scrollTop', { value: 10 });

      expect(service.shouldDrag(el, false)).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should calculate translate based on direction', () => {
      const mockDrawer = { offsetHeight: 500, offsetWidth: 300 } as any;
      
      expect(service.getTranslateBasedOnDirection({ drawer: mockDrawer, direction: DrawerDirection.BOTTOM })).toBe(500);
      expect(service.getTranslateBasedOnDirection({ drawer: mockDrawer, direction: DrawerDirection.TOP })).toBe(-500);
      expect(service.getTranslateBasedOnDirection({ drawer: mockDrawer, direction: DrawerDirection.LEFT })).toBe(-300);
      expect(service.getTranslateBasedOnDirection({ drawer: mockDrawer, direction: DrawerDirection.RIGHT })).toBe(300);
    });

    it('should calculate scale', () => {
      const originalInnerWidth = window.innerWidth;
      (window as any).innerWidth = 1000;
      // WINDOW_TOP_OFFSET is 26
      expect(service.getScale()).toBe((1000 - 26) / 1000);
      (window as any).innerWidth = originalInnerWidth;
    });
  });

  describe('Actions', () => {
    it('should close drawer and cancel drag', () => {
      const mockDrawer = document.createElement('div');
      mockDrawer.classList.add(DRAG_CLASS);
      service.setIsDragging(true);
      service.setIsOpen(true);
      
      service.closeDrawer(mockDrawer);
      
      expect(service.isOpen$.value).toBe(false);
      expect(service.isDragging$.value).toBe(false);
      expect(mockDrawer.classList.contains(DRAG_CLASS)).toBe(false);
    });
  });

  it('should clean up on destroy', () => {
    const nextSpy = vi.spyOn((service as any).destroy$, 'next');
    const completeSpy = vi.spyOn((service as any).destroy$, 'complete');
    
    service.ngOnDestroy();
    
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
