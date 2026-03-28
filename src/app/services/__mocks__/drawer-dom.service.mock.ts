import { DrawerDirectionType } from '../../types';

export const createDrawerDomMock = () => ({
  getTranslateBasedOnDirection: ({
    drawer,
    direction,
  }: {
    drawer: HTMLDivElement;
    direction: DrawerDirectionType;
  }): number => 0,

  getTranslate: (element: HTMLElement, direction: DrawerDirectionType): number | null => 0,

  getScale: (): number => 0.974,

  getWrapperElement: (): HTMLElement | null => null,
});
