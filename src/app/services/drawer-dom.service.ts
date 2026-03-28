import { Injectable } from '@angular/core';
import { DrawerDirection, DrawerDirectionType } from '../types';
import { WINDOW_TOP_OFFSET } from './constants';
import { isVertical } from '../utils/helpers';

@Injectable({ providedIn: 'root' })
export class DrawerDomService {
  /**
   * Reads the current CSS translate offset from a transformed element.
   * Returns 0 when no transform is set, null when the matrix cannot be parsed.
   */
  getTranslate(element: HTMLElement, direction: DrawerDirectionType): number | null {
    if (!element) return null;
    const style = window.getComputedStyle(element);
    const transform = (style as any).transform || (style as any).webkitTransform || (style as any).mozTransform;
    if (!transform || transform === 'none') return 0;

    let mat = transform.match(/^matrix3d\((.+)\)$/);
    if (mat) {
      return parseFloat(mat[1].split(', ')[isVertical(direction) ? 13 : 12]);
    }
    mat = transform.match(/^matrix\((.+)\)$/);
    return mat ? parseFloat(mat[1].split(', ')[isVertical(direction) ? 5 : 4]) : null;
  }

  /** Returns the translate offset (in px) needed to fully hide the drawer off-screen. */
  getTranslateBasedOnDirection({ drawer, direction }: { drawer: HTMLDivElement; direction: DrawerDirectionType }): number {
    if (!drawer) return 0;
    if (direction === DrawerDirection.BOTTOM) return drawer.offsetHeight;
    if (direction === DrawerDirection.TOP) return -drawer.offsetHeight;
    if (direction === DrawerDirection.LEFT) return -drawer.offsetWidth;
    if (direction === DrawerDirection.RIGHT) return drawer.offsetWidth;
    return isVertical(direction) ? drawer.offsetHeight : drawer.offsetWidth;
  }

  /** Scale factor applied to the background wrapper when the drawer is open. */
  getScale(): number {
    return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
  }

  /** Finds the nearest `[data-vaul-drawer-wrapper]` element in the document. */
  getWrapperElement(): HTMLElement | null {
    return document.querySelector('[data-vaul-drawer-wrapper]');
  }
}
