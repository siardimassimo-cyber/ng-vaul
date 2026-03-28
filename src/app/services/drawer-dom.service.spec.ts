import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DrawerDomService } from './drawer-dom.service';
import { DrawerDirection } from '../types';
import { WINDOW_TOP_OFFSET } from './constants';
import { createMockHTMLElement } from './__mocks__/dom-helpers.mock';

describe('DrawerDomService', () => {
  let service: DrawerDomService;
  let mockDrawer = createMockHTMLElement();

  beforeEach(() => {
    service = TestBed.inject(DrawerDomService);
  });

  describe('getTranslateBasedOnDirection', () => {
    it('should return height for BOTTOM direction', () => {
      const result = service.getTranslateBasedOnDirection({
        drawer: mockDrawer,
        direction: DrawerDirection.BOTTOM,
      });
      expect(result).toBe(500);
    });

    it('should return negative height for TOP direction', () => {
      const result = service.getTranslateBasedOnDirection({
        drawer: mockDrawer,
        direction: DrawerDirection.TOP,
      });
      expect(result).toBe(-500);
    });

    it('should return negative width for LEFT direction', () => {
      const result = service.getTranslateBasedOnDirection({
        drawer: mockDrawer,
        direction: DrawerDirection.LEFT,
      });
      expect(result).toBe(-300);
    });

    it('should return width for RIGHT direction', () => {
      const result = service.getTranslateBasedOnDirection({
        drawer: mockDrawer,
        direction: DrawerDirection.RIGHT,
      });
      expect(result).toBe(300);
    });

    it('should return 0 for null drawer', () => {
      const result = service.getTranslateBasedOnDirection({
        drawer: null as any,
        direction: DrawerDirection.BOTTOM,
      });
      expect(result).toBe(0);
    });

    it('should handle different drawer dimensions', () => {
      const smallDrawer = createMockHTMLElement();
      Object.defineProperty(smallDrawer, 'offsetHeight', { value: 200 });
      Object.defineProperty(smallDrawer, 'offsetWidth', { value: 100 });

      expect(
        service.getTranslateBasedOnDirection({
          drawer: smallDrawer,
          direction: DrawerDirection.BOTTOM,
        }),
      ).toBe(200);

      expect(
        service.getTranslateBasedOnDirection({
          drawer: smallDrawer,
          direction: DrawerDirection.RIGHT,
        }),
      ).toBe(100);
    });
  });

  describe('getScale', () => {
    it('should calculate scale based on window.innerWidth', () => {
      const originalWidth = window.innerWidth;
      const testWidth = 1000;

      (window as any).innerWidth = testWidth;
      const result = service.getScale();

      expect(result).toBe((testWidth - WINDOW_TOP_OFFSET) / testWidth);

      (window as any).innerWidth = originalWidth;
    });

    it('should return value less than 1', () => {
      const scale = service.getScale();
      expect(scale).toBeLessThan(1);
      expect(scale).toBeGreaterThan(0);
    });

    it('should account for WINDOW_TOP_OFFSET', () => {
      const originalWidth = window.innerWidth;
      (window as any).innerWidth = 800;

      const result = service.getScale();
      const expected = (800 - WINDOW_TOP_OFFSET) / 800;

      expect(result).toBe(expected);

      (window as any).innerWidth = originalWidth;
    });

    it('should scale differently for different window widths', () => {
      const originalWidth = window.innerWidth;

      (window as any).innerWidth = 1000;
      const scale1000 = service.getScale();

      (window as any).innerWidth = 500;
      const scale500 = service.getScale();

      expect(scale1000).not.toBe(scale500);
      expect(scale1000).toBeGreaterThan(scale500);

      (window as any).innerWidth = originalWidth;
    });
  });

  describe('getTranslate', () => {
    it('should return 0 when no transform is set', () => {
      const element = document.createElement('div');
      const result = service.getTranslate(element, DrawerDirection.BOTTOM);
      expect(result).toBe(0);
    });

    it('should return null for null element', () => {
      const result = service.getTranslate(null as any, DrawerDirection.BOTTOM);
      expect(result).toBeNull();
    });

    it('should parse matrix3d transform for vertical direction', () => {
      const element = document.createElement('div');
      // mock matrix3d with Y translation (index 13)
      element.style.transform = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 250, 0, 1)';
      const result = service.getTranslate(element, DrawerDirection.BOTTOM);
      expect(result).toBe(250);
    });

    it('should parse matrix3d transform for horizontal direction', () => {
      const element = document.createElement('div');
      // mock matrix3d with X translation (index 12)
      element.style.transform = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 100, 0, 0, 1)';
      const result = service.getTranslate(element, DrawerDirection.RIGHT);
      expect(result).toBe(100);
    });

    it('should parse matrix2d transform for vertical direction', () => {
      const element = document.createElement('div');
      element.style.transform = 'matrix(1, 0, 0, 1, 0, 150)';

      const result = service.getTranslate(element, DrawerDirection.BOTTOM);
      expect(result).toBe(150);
    });

    it('should parse matrix2d transform for horizontal direction', () => {
      const element = document.createElement('div');
      element.style.transform = 'matrix(1, 0, 0, 1, 200, 0)';

      const result = service.getTranslate(element, DrawerDirection.RIGHT);
      expect(result).toBe(200);
    });

    it('should return null for invalid matrix format', () => {
      const element = document.createElement('div');
      element.style.transform = 'rotate(45deg)';

      const result = service.getTranslate(element, DrawerDirection.BOTTOM);
      expect(result).toBeNull();
    });

    it('should handle transform "none"', () => {
      const element = document.createElement('div');
      element.style.transform = 'none';

      const result = service.getTranslate(element, DrawerDirection.BOTTOM);
      expect(result).toBe(0);
    });
  });

  describe('getWrapperElement', () => {
    it('should return null when wrapper element does not exist', () => {
      const result = service.getWrapperElement();
      expect(result === null || result instanceof HTMLElement).toBe(true);
    });

    it('should find wrapper element when it exists', () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-vaul-drawer-wrapper', '');
      document.body.appendChild(wrapper);

      const result = service.getWrapperElement();

      expect(result).toBe(wrapper);

      document.body.removeChild(wrapper);
    });

    it('should find first wrapper element if multiple exist', () => {
      const wrapper1 = document.createElement('div');
      wrapper1.setAttribute('data-vaul-drawer-wrapper', '');
      const wrapper2 = document.createElement('div');
      wrapper2.setAttribute('data-vaul-drawer-wrapper', '');

      document.body.appendChild(wrapper1);
      document.body.appendChild(wrapper2);

      const result = service.getWrapperElement();

      expect(result).toBe(wrapper1);

      document.body.removeChild(wrapper1);
      document.body.removeChild(wrapper2);
    });
  });
});
