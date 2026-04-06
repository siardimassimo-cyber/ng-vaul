import { effect, Injectable, inject, signal } from '@angular/core';
import { isSafari } from './browser';
import { DrawerService } from './drawer.service';

let previousBodyPosition: Record<string, string> | null = null;

@Injectable({
  providedIn: 'root',
})
export class PositionFixedService {
  private readonly drawerService = inject(DrawerService);
  private readonly activeUrl = signal<string>(typeof window !== 'undefined' ? window.location.href : '');

  constructor() {
    effect(() => {
      const isOpen = this.drawerService.isOpen();
      const nested = this.drawerService.nested();
      const hasBeenOpened = this.drawerService.hasBeenOpened();
      const modal = this.drawerService.modal();
      const noBodyStyles = this.drawerService.noBodyStyles();

      if (!nested && hasBeenOpened) {
        if (isOpen) {
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
          if (!isStandalone) {
            this.setPositionFixed(noBodyStyles);
          }

          if (!modal) {
            window.setTimeout(() => {
              this.restorePositionSetting();
            }, 500);
          }
        } else {
          this.restorePositionSetting();
        }
      }
    });

    if (typeof window !== 'undefined') {
      const observer = new MutationObserver(() => {
        this.activeUrl.set(window.location.href);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  setPositionFixed(noBodyStyles: boolean) {
    if (previousBodyPosition === null && !noBodyStyles) {
      previousBodyPosition = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        height: document.body.style.height,
        right: 'unset',
      };

      const { scrollX, innerHeight } = window;
      const currentScrollPos = window.scrollY;

      document.body.style.setProperty('position', 'fixed', 'important');
      Object.assign(document.body.style, {
        top: `${-currentScrollPos}px`,
        left: `${-scrollX}px`,
        right: '0px',
        height: 'auto',
      });

      window.setTimeout(
        () =>
          window.requestAnimationFrame(() => {
            const bottomBarHeight = innerHeight - window.innerHeight;
            if (bottomBarHeight && currentScrollPos >= innerHeight) {
              document.body.style.top = `${-(currentScrollPos + bottomBarHeight)}px`;
            }
          }),
        300,
      );
    }
  }

  private restorePositionSetting() {
    if (!isSafari()) return;

    if (previousBodyPosition !== null) {
      const y = -parseInt(document.body.style.top, 10);
      const x = -parseInt(document.body.style.left, 10);

      Object.assign(document.body.style, previousBodyPosition);

      window.requestAnimationFrame(() => {
        const currentUrl = this.activeUrl();
        if (this.drawerService.preventScrollRestoration() && currentUrl !== window.location.href) {
          this.activeUrl.set(window.location.href);
          return;
        }

        window.scrollTo(x, y);
      });

      previousBodyPosition = null;
    }
  }

}
