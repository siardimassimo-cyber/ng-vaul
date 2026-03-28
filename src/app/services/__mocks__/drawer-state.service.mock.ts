import { BehaviorSubject } from 'rxjs';
import { DrawerDirection, DrawerDirectionType } from '../../types';

export const createDrawerStateMock = () => ({
  stateChange$: new BehaviorSubject<void>(undefined),
  isOpen$: new BehaviorSubject<boolean>(false),
  isDragging$: new BehaviorSubject<boolean>(false),
  drawerRef$: new BehaviorSubject<HTMLDivElement | null>(null),
  overlayRef$: new BehaviorSubject<HTMLElement | null>(null),
  direction$: new BehaviorSubject<DrawerDirectionType>(DrawerDirection.BOTTOM),
  hasBeenOpened$: new BehaviorSubject<boolean>(false),
  openTime$: new BehaviorSubject<Date | null>(null),
  shouldScaleBackground$: new BehaviorSubject<boolean>(false),
  setBackgroundColorOnScale$: new BehaviorSubject<boolean>(false),
  noBodyStyles$: new BehaviorSubject<boolean>(false),
  nested$: new BehaviorSubject<boolean>(false),
  modal$: new BehaviorSubject<boolean>(false),
  preventScrollRestoration$: new BehaviorSubject<boolean>(false),

  setIsOpen: (isOpen: boolean) => {
    // implementation
  },
  setIsDragging: (isDragging: boolean) => {
    // implementation
  },
  setDirection: (direction: DrawerDirectionType) => {
    // implementation
  },
  setDrawerRef: (ref: HTMLDivElement | null) => {
    // implementation
  },
  setOverlayRef: (ref: HTMLElement | null) => {
    // implementation
  },
  setScaleBackground: (value: boolean) => {
    // implementation
  },
  setBackgroundColor: (value: boolean) => {
    // implementation
  },
  setNoBodyStyles: (value: boolean) => {
    // implementation
  },
  setNested: (value: boolean) => {
    // implementation
  },
  setModal: (value: boolean) => {
    // implementation
  },
  setHasBeenOpened: (value: boolean) => {
    // implementation
  },
  setPreventScrollRestoration: (value: boolean) => {
    // implementation
  },
  getShouldScaleBackground: () => false,
  getBackgroundColorOnScale: () => false,
  getNoBodyStyles: () => false,
  getNested: () => false,
  getModal: () => false,
  getHasBeenOpened: () => false,
  getPreventScrollRestoration: () => false,
  ngOnDestroy: () => {
    // implementation
  },
});
