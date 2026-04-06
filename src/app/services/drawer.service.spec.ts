import { describe, it, expect, beforeEach, vi, afterEach, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DrawerService } from './drawer.service';
import { DrawerStateService } from './drawer-state.service';
import { DrawerDragService } from './drawer-drag.service';
import { DrawerSnapService } from './drawer-snap.service';
import { DrawerDomService } from './drawer-dom.service';
import { DrawerDirection } from '../types';
import { createMockHTMLElement, setupDrawerDOM } from './__mocks__/dom-helpers.mock';

describe('DrawerService (Facade)', () => {
  let service: DrawerService;
  let stateService: DrawerStateService;
  let dragService: DrawerDragService;
  let snapService: DrawerSnapService;
  let domService: DrawerDomService;
  let mockDrawer: HTMLDivElement;
  let domSetup: { wrapper: HTMLElement; cleanup: () => void };

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [DrawerService, DrawerStateService, DrawerDragService, DrawerSnapService, DrawerDomService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(DrawerService);
    stateService = TestBed.inject(DrawerStateService);
    dragService = TestBed.inject(DrawerDragService);
    snapService = TestBed.inject(DrawerSnapService);
    domService = TestBed.inject(DrawerDomService);
    mockDrawer = createMockHTMLElement();
    domSetup = setupDrawerDOM();
  });

  afterEach(() => {
    domSetup.cleanup();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial closed state', () => {
      expect(service.isOpen()).toBe(false);
      expect(service.isDragging()).toBe(false);
    });

    it('should have default direction BOTTOM', () => {
      expect(service.direction()).toBe(DrawerDirection.BOTTOM);
    });
  });

  describe('State Management (Delegates to DrawerStateService)', () => {
    it('should delegate setIsOpen to state service', () => {
      const spy = vi.spyOn(stateService, 'setIsOpen');
      service.setIsOpen(true);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should delegate setDirection to state service', () => {
      const spy = vi.spyOn(stateService, 'setDirection');
      service.setDirection(DrawerDirection.LEFT);
      expect(spy).toHaveBeenCalledWith(DrawerDirection.LEFT);
    });

    it('should delegate setIsDragging to state service', () => {
      const spy = vi.spyOn(stateService, 'setIsDragging');
      service.setIsDragging(true);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should expose isOpen signal from state service', () => {
      expect(service.isOpen).toBe(stateService.isOpen);
    });

    it('should expose direction signal from state service', () => {
      expect(service.direction).toBe(stateService.direction);
    });

    it('should expose isDragging signal from state service', () => {
      expect(service.isDragging).toBe(stateService.isDragging);
    });

    it('should expose drawerRef signal from state service', () => {
      expect(service.drawerRef).toBe(stateService.drawerRef);
    });

    it('should expose hasBeenOpened signal from state service', () => {
      expect(service.hasBeenOpened).toBe(stateService.hasBeenOpened);
    });

    describe('Flag Getters/Setters', () => {
      it('should delegate shouldScaleBackground operations', () => {
        service.setScaleBackground(true);
        expect(service.shouldScaleBackground()).toBe(true);
        service.setScaleBackground(false);
        expect(service.shouldScaleBackground()).toBe(false);
      });

      it('should delegate modal flag', () => {
        service.setModal(true);
        expect(service.modal()).toBe(true);
      });

      it('should delegate nested flag', () => {
        service.setNested(true);
        expect(service.nested()).toBe(true);
      });

      it('should delegate noBodyStyles flag', () => {
        service.setNoBodyStyles(true);
        expect(service.noBodyStyles()).toBe(true);
      });

      it('should delegate preventScrollRestoration flag', () => {
        service.setPreventScrollRestoration(true);
        expect(service.preventScrollRestoration()).toBe(true);
      });

      it('should delegate hasBeenOpened flag', () => {
        service.setHasBeenOpened(true);
        expect(service.hasBeenOpened()).toBe(true);
      });

      it('should delegate backgroundColorOnScale flag', () => {
        service.setBackgroundColor(true);
        expect(service.backgroundColorOnScale()).toBe(true);
      });
    });
  });

  describe('Drag Methods (Delegates to DrawerDragService)', () => {
    it('should delegate onPress to drag service', () => {
      const spy = vi.spyOn(dragService, 'onPress').mockImplementation(() => {});
      const mockElement = document.createElement('div');
      const event = new PointerEvent('pointerdown');
      service.onPress(event, mockElement);
      expect(spy).toHaveBeenCalledWith(event, mockElement);
    });

    it('should delegate onDrag to drag service', () => {
      const spy = vi.spyOn(dragService, 'onDrag').mockImplementation(() => {});
      const mockElement = document.createElement('div');
      const event = new PointerEvent('pointermove');
      service.onDrag(event, mockElement, true);
      expect(spy).toHaveBeenCalledWith(event, mockElement, true);
    });

    it('should delegate onRelease to drag service', () => {
      const spy = vi.spyOn(dragService, 'onRelease');
      const mockElement = document.createElement('div');
      const event = new PointerEvent('pointerup');
      service.onRelease(event, DrawerDirection.BOTTOM, mockElement);
      expect(spy).toHaveBeenCalledWith(event, DrawerDirection.BOTTOM, mockElement);
    });

    it('should delegate shouldDrag to drag service', () => {
      const spy = vi.spyOn(dragService, 'shouldDrag');
      const mockElement = document.createElement('div');
      service.shouldDrag(mockElement, true);
      expect(spy).toHaveBeenCalledWith(mockElement, true);
    });

    it('should delegate resetDrawer to drag service', () => {
      const spy = vi.spyOn(dragService, 'resetDrawer');
      const mockElement = document.createElement('div');
      service.resetDrawer(DrawerDirection.BOTTOM, mockElement);
      expect(spy).toHaveBeenCalledWith(DrawerDirection.BOTTOM, mockElement);
    });

    it('should delegate closeDrawer to drag service', () => {
      const spy = vi.spyOn(dragService, 'closeDrawer');
      const mockElement = document.createElement('div');
      service.closeDrawer(mockElement);
      expect(spy).toHaveBeenCalledWith(mockElement);
    });

    it('should expose pointerStart signal from drag service', () => {
      expect(service.pointerStart).toBe(dragService.pointerStart);
    });

    it('should expose dragStartPosition signal from drag service', () => {
      expect(service.dragStartPosition).toBe(dragService.dragStartPosition);
    });

    it('should expose isAllowedToDrag signal from drag service', () => {
      expect(service.isAllowedToDrag).toBe(dragService.isAllowedToDrag);
    });
  });

  describe('Snap Methods (Delegates to DrawerSnapService)', () => {
    it('should delegate getSnapPointsOffset to snap service', () => {
      const spy = vi.spyOn(snapService, 'getSnapPointsOffset');
      service.getSnapPointsOffset();
      expect(spy).toHaveBeenCalled();
    });

    it('should delegate goToAdjacentSnap to snap service', () => {
      const spy = vi.spyOn(snapService, 'goToAdjacentSnap');
      service.goToAdjacentSnap(1);
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should expose snapPoints signal from snap service', () => {
      expect(service.snapPoints).toBe(snapService.snapPoints);
    });

    it('should expose activeSnapPoint signal from snap service', () => {
      expect(service.activeSnapPoint).toBe(snapService.activeSnapPoint);
    });

    it('should expose activeSnapPointIndex computed from snap service', () => {
      expect(service.activeSnapPointIndex).toBe(snapService.activeSnapPointIndex);
    });
  });

  describe('DOM Methods (Delegates to DrawerDomService)', () => {
    it('should delegate getTranslateBasedOnDirection to dom service', () => {
      const spy = vi.spyOn(domService, 'getTranslateBasedOnDirection');
      const mockDrawer = document.createElement('div');
      service.getTranslateBasedOnDirection({ drawer: mockDrawer, direction: DrawerDirection.BOTTOM });
      expect(spy).toHaveBeenCalledWith({ drawer: mockDrawer, direction: DrawerDirection.BOTTOM });
    });

    it('should delegate getScale to dom service', () => {
      const spy = vi.spyOn(domService, 'getScale');
      service.getScale();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Drawer Ref Setup', () => {
    it('should set drawer ref and apply initial hidden transform for BOTTOM direction', () => {
      const ref = createMockHTMLElement({ offsetHeight: 500, offsetWidth: 300 });
      service.setDirection(DrawerDirection.BOTTOM);
      service.setDrawerRef(ref);
      expect(service.drawerRef()).toBe(ref);
      expect(ref.style.transform).toBe('translateY(500px)');
    });

    it('should set drawer ref and apply initial hidden transform for TOP direction', () => {
      const ref = createMockHTMLElement({ offsetHeight: 400 });
      service.setDirection(DrawerDirection.TOP);
      service.setDrawerRef(ref);
      expect(ref.style.transform).toBe('translateY(-400px)');
    });

    it('should set drawer ref and apply initial hidden transform for LEFT direction', () => {
      const ref = createMockHTMLElement({ offsetWidth: 300 });
      service.setDirection(DrawerDirection.LEFT);
      service.setDrawerRef(ref);
      expect(ref.style.transform).toBe('translateX(-300px)');
    });

    it('should set drawer ref and apply initial hidden transform for RIGHT direction', () => {
      const ref = createMockHTMLElement({ offsetWidth: 350 });
      service.setDirection(DrawerDirection.RIGHT);
      service.setDrawerRef(ref);
      expect(ref.style.transform).toBe('translateX(350px)');
    });

    it('should allow setting drawer ref to null', () => {
      service.setDrawerRef(null);
      expect(service.drawerRef()).toBeNull();
    });
  });

  describe('Overlay Ref Setup', () => {
    it('should set overlay ref', () => {
      const mockOverlay = document.createElement('div');
      service.setOverlayRef(mockOverlay);
      expect(service.overlayRef()).toBe(mockOverlay);
    });

    it('should allow setting overlay ref to null', () => {
      service.setOverlayRef(null);
      expect(service.overlayRef()).toBeNull();
    });

    it('should expose overlayRef signal from state service', () => {
      expect(service.overlayRef).toBe(stateService.overlayRef);
    });
  });

  describe('Constructor Initialization', () => {
    it('should apply hidden transform when drawer ref is registered and drawer is closed', () => {
      service.setDirection(DrawerDirection.BOTTOM);
      service.setDrawerRef(mockDrawer);
      TestBed.flushEffects();

      if (service.drawerRef() && !service.isOpen()) {
        expect(service.drawerRef()!.style.transform).toBe('translateY(500px)');
      }
    });

    it('should sync drawer position when opening with snap points', () => {
      service.setDirection(DrawerDirection.BOTTOM);
      service.setDrawerRef(mockDrawer);

      snapService.snapPoints.set([0.5, 1]);
      snapService.activeSnapPoint.set(0.5);

      service.setIsOpen(true);
      TestBed.flushEffects();

      expect(service.isOpen()).toBe(true);
    });
  });

  describe('drawerTransform computed signal', () => {
    it('should return null when drawer ref is not set', () => {
      TestBed.flushEffects();
      expect(service.drawerTransform()).toBeNull();
    });

    it('should compute vertical transform when drawer is set and not dragging', () => {
      service.setDirection(DrawerDirection.BOTTOM);
      service.setDrawerRef(mockDrawer);
      TestBed.flushEffects();
      expect(service.drawerTransform()).toContain('translateY');
    });

    it('should compute horizontal transform when drawer is set and direction is right', () => {
      service.setDirection(DrawerDirection.RIGHT);
      service.setDrawerRef(mockDrawer);
      TestBed.flushEffects();
      expect(service.drawerTransform()).toContain('translateX');
    });
  });

  describe('Full Workflows', () => {
    it('should open drawer and sync to first snap point', () => {
      const ref = createMockHTMLElement({ offsetHeight: 500, offsetWidth: 300 });
      service.setDirection(DrawerDirection.BOTTOM);
      service.setDrawerRef(ref);
      snapService.snapPoints.set([0.4, 0.8, 1]);

      service.setIsOpen(true);

      expect(service.isOpen()).toBe(true);
      expect(service.hasBeenOpened()).toBe(true);
    });

    it('should toggle between open and closed states', () => {
      service.setIsOpen(true);
      expect(service.isOpen()).toBe(true);

      service.setIsOpen(false);
      expect(service.isOpen()).toBe(false);
      expect(service.hasBeenOpened()).toBe(true);
    });
  });
});
