# ng-vaul

An experimental Angular port of [Vaul](https://vaul.emilkowal.ski/), the unstyled drawer component for React.

## About

This project aims to bring the functionality and accessibility of Vaul to the Angular ecosystem. It provides a drawer component that can be used as a dialog replacement on mobile and tablet devices.

> [!NOTE]
> This is currently a work in progress and an exercise in porting the library.

## Features

- Unstyled and accessible
- Snap points
- Custom directions (top, bottom, left, right)
- Mobile-friendly gestures

## Usage

```html
<vaul-drawer [open]="isOpen()">
  <vaul-overlay />
  <div class="drawer-content">
    <div class="content">
      <h2>Drawer Title</h2>
      <p>Content goes here...</p>
    </div>
  </div>
</vaul-drawer>
```

## Credits

- [Vaul](https://github.com/emilkowalski/vaul) by [Emil Kowalski](https://github.com/emilkowalski) - The original React library.
