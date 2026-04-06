import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScaleBackgroundService implements OnDestroy {
  public timeoutId: number | null = null;
  public readonly initialBackgroundColor = signal<string>(
    typeof document !== 'undefined' ? document.body.style.backgroundColor : '',
  );

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
