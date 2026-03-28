# Accessibility Checklist (WCAG AA)

Your project requires WCAG AA compliance. Use this checklist for every component.

## Quick Checklist

- [ ] Pass AXE accessibility scanner with zero violations
- [ ] Color contrast minimum 4.5:1 for body text, 3:1 for large text
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Semantic HTML (button, a, form, fieldset, legend, label)
- [ ] ARIA labels on custom controls
- [ ] Form fields have associated labels
- [ ] Images have alt text
- [ ] No focus traps
- [ ] Screen reader announces all content

## ARIA Attributes

### Button Roles

```typescript
// For custom button
<div role="button" [attr.tabindex]="0" (click)="onClick()">
  Click me
</div>

// For toggle button
<button [attr.aria-pressed]="isPressed()">Toggle</button>
```

### Links and Navigation

```typescript
// Navigation landmark
<nav [attr.aria-label]="'Main navigation'">
  <a href="/home" [attr.aria-current]="currentPage() === 'home'">Home</a>
</nav>
```

### Form Controls

```typescript
// Label for input
<label [for]="inputId">Email</label>
<input [id]="inputId" type="email" />

// Aria-describedby for hint
<input [attr.aria-describedby]="hintId" />
<span [id]="hintId">Must be a valid email</span>

// Required field
<input [attr.aria-required]="true" />
```

### Live Regions

```typescript
// For updates without page reload
<div [attr.aria-live]="'polite'" [attr.aria-atomic]="'true'">
  {{ statusMessage() }}
</div>
```

### Lists

```typescript
// Proper list structure
<ul role="list">
  @for (item of items(); track item.id) {
    <li>{{ item.name }}</li>
  }
</ul>
```

## Color Contrast

### Text Contrast Requirements

- **Normal text (< 18px):** 4.5:1 contrast ratio
- **Large text (≥ 18px):** 3:1 contrast ratio
- **UI components:** 3:1 contrast ratio

### Tools

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Browser DevTools: Check with color picker

## Keyboard Navigation

### Standard Keys

- **Tab:** Move focus forward
- **Shift+Tab:** Move focus backward
- **Enter:** Activate button
- **Space:** Toggle checkbox/button
- **Escape:** Close modal/popover
- **Arrow Keys:** Navigate lists/menus

### Implementation

```typescript
@Component({
  host: {
    '[attr.tabindex]': '0',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class KeyboardComponent {
  handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onClick();
        break;
      case 'Escape':
        this.onEscape();
        break;
    }
  }
}
```

## Focus Management

### Focus Outline

```typescript
// Ensure visible focus
button:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}
```

### Manage Focus Programmatically

```typescript
@ViewChild('submitButton') submitButton?: ElementRef<HTMLButtonElement>;

ngAfterViewInit() {
  this.submitButton?.nativeElement.focus();
}
```

### Skip Links

```typescript
// Allow users to skip to main content
<a href="#main-content" class="sr-only">Skip to main content</a>

<main id="main-content">
  <!-- Main content -->
</main>
```

## Semantic HTML

### Use Semantic Elements

```html
<!-- ✓ CORRECT -->
<header>
  <nav>
    <ul>
      <li><a href="/home">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>
<footer>
  <p>Copyright 2024</p>
</footer>

<!-- ✗ WRONG -->
<div class="header">
  <div class="nav">
    <div class="list">
      <div class="item"><span>Home</span></div>
    </div>
  </div>
</div>
```

### Form Semantics

```html
<form>
  <fieldset>
    <legend>Personal Information</legend>

    <div>
      <label for="name">Name</label>
      <input id="name" type="text" required />
    </div>

    <div>
      <label for="email">Email</label>
      <input id="email" type="email" required />
    </div>
  </fieldset>
</form>
```

## Images and Media

### Alt Text

```html
<!-- Decorative image (empty alt) -->
<img src="spacer.png" alt="" />

<!-- Informative image -->
<img src="user-profile.jpg" alt="Profile photo of John Doe" />

<!-- Complex image -->
<figure>
  <img src="chart.png" alt="Sales chart showing Q1 growth" />
  <figcaption>Quarter 1 sales increased 25%</figcaption>
</figure>
```

## Color and Visual Information

### Don't Rely on Color Alone

```css
/* ✗ WRONG - Color only */
.error {
  color: red;
}
.success {
  color: green;
}

/* ✓ CORRECT - Color + icon/text */
.error {
  color: red;
}
.error::before {
  content: '✕ ';
}

.success {
  color: green;
}
.success::before {
  content: '✓ ';
}
```

## Screen Reader Only Content

```css
/* Hide from visual users, visible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Testing Checklist

### Automated Testing

- [ ] Run AXE DevTools (browser extension)
- [ ] Use axe-core npm package in tests
- [ ] Check Lighthouse accessibility score

### Manual Testing

- [ ] Keyboard-only navigation (no mouse)
- [ ] Tab order is logical
- [ ] All buttons/links reachable via keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Check color contrast (WebAIM checker)
- [ ] Resize text to 200% - readable?
- [ ] Zoom to 200% - layout intact?

### Code Review

- [ ] Semantic HTML used
- [ ] ARIA attributes correct
- [ ] No keyboard traps
- [ ] Labels present for form fields
- [ ] Focus management in modals/dialogs
- [ ] Colors tested for contrast
- [ ] Alternative text for images

## AXE-Core Testing

### Install

```bash
npm install --save-dev @axe-core/angular
```

### In Tests

```typescript
import { axe, toHaveNoViolations } from 'jasmine-axe';

expect(toHaveNoViolations()).toBeDefined();

it('should not have accessibility violations', async () => {
  const results = await axe(fixture.nativeElement);
  expect(results).toHaveNoViolations();
});
```

## Resources

- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **WebAIM Articles:** https://webaim.org/
- **Angular Accessibility:** https://angular.io/guide/accessibility

## Common Violations to Avoid

- Images without alt text
- Form inputs without labels
- Buttons with no accessible name
- Color contrast < 4.5:1
- Missing focus indicators
- Keyboard traps
- Using div/span for buttons
- Missing heading hierarchy
- Auto-playing audio/video
- Flickering/flashing content
