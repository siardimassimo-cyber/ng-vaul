---
name: angular-developer
description: This skill should be used when the user asks to "create an Angular component", "generate a service", "build a feature", "implement signals", "set up routing", "add forms", "handle state", "configure dependency injection", "improve accessibility", or needs architectural guidance for Angular development. Useful for generating idiomatic Angular code aligned with modern best practices including signals, standalone components, reactive forms, and WCAG AA accessibility.
version: 1.0.0
---

# Angular Developer Skill

Generates Angular code and provides architectural guidance for building scalable, maintainable, and accessible Angular applications. This skill enforces project-specific best practices from CLAUDE.md including signals-based state management, standalone components, reactive forms, and WCAG AA compliance.

## When to Use This Skill

Use when:

- Creating new Angular components, services, or directives
- Implementing state management with signals
- Setting up routing and feature modules
- Building reactive forms
- Improving accessibility (ARIA, color contrast, focus management)
- Refactoring legacy code to modern patterns
- Requesting architectural guidance or best practices
- Debugging Angular-specific issues

## Core Principles

All Angular code in this project follows these principles (from CLAUDE.md):

### Modern Angular (v20+)

- **Standalone components by default** - All new components use standalone: true (implicit in v20+)
- **Signals for state** - Use `signal()`, `computed()`, and `effect()` for reactive state
- **Dependency injection** - Use `inject()` function instead of constructor injection
- **Input/Output functions** - Use `input()` and `output()` functions instead of decorators
- **Change detection** - Always set `changeDetection: ChangeDetectionStrategy.OnPush`

### Code Generation Guidelines

#### Components

Generate components with:

- Minimal, focused responsibility (single component per domain concept)
- Inline templates for small components (under 20 lines)
- External templates/styles with relative paths (e.g., `./my.component.html`)
- `input()` and `output()` functions for component contracts
- `@Component` decorator with `host` object (not `@HostBinding`/`@HostListener`)
- `ChangeDetectionStrategy.OnPush` for performance

**Template Requirements:**

- Native control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`, `*ngSwitch`)
- Class bindings: `[class.active]="isActive"` (not `[ngClass]`)
- Style bindings: `[style.color]="myColor"` (not `[ngStyle]`)
- No arrow functions in templates
- Use async pipe for observables
- No inline `new Date()` or globals - inject these via services

#### Services

Generate services with:

- Single responsibility principle
- `providedIn: 'root'` for singletons
- `inject()` function for dependencies
- Pure, predictable state transformations
- Proper error handling and type safety

#### Forms

- Always use Reactive Forms, never Template-driven
- Use `FormBuilder` or typed form groups
- Implement proper validation and error messaging
- Leverage Signals for form state when appropriate

#### Routing

- Lazy load feature routes
- Use typed routes and route guards
- Configure standalone route configurations
- Implement proper preloading strategies

### Accessibility Requirements (WCAG AA)

All components MUST:

- Pass AXE accessibility checks
- Follow WCAG AA color contrast minimums (4.5:1 for text)
- Include proper ARIA labels and roles
- Support keyboard navigation
- Manage focus properly
- Use semantic HTML

### TypeScript Standards

- Enable strict mode (`strict: true`)
- Avoid `any` type - use `unknown` when type is uncertain
- Prefer type inference when obvious
- Use union types and discriminated unions
- Implement proper error handling

## How to Use This Skill

### Requesting Components

```
Create an AuthService that:
- Manages user authentication state with signals
- Provides login/logout methods
- Handles JWT tokens securely
```

### Requesting Features

```
Build a user profile feature with:
- ProfileComponent showing user details
- EditProfileComponent for updates
- Signals-based state management
- Full WCAG AA compliance
```

### Requesting Architectural Guidance

```
How should I structure state management for a complex feature?
What's the best pattern for handling async data loading?
How do I implement proper error handling in forms?
```

### Requesting Refactoring

```
Refactor this component to use signals instead of BehaviorSubject
Migrate this NgModule to standalone components
Update this form to use Reactive Forms
```

## Additional Resources

### Reference Files

For detailed patterns and techniques, consult:

- **`references/signals-patterns.md`** - Signals state management patterns
- **`references/component-patterns.md`** - Component structure and best practices
- **`references/accessibility-checklist.md`** - WCAG AA compliance checklist
- **`references/forms-patterns.md`** - Reactive forms patterns
- **`references/routing-patterns.md`** - Feature routing and lazy loading

### Example Files

Working examples in `examples/`:

- **`example-component.ts`** - Well-structured standalone component
- **`example-service.ts`** - Signals-based service
- **`example-form.ts`** - Reactive form implementation
- **`example-accessibility.ts`** - Accessible component with ARIA

## Implementation Checklist

When generating code, ensure:

- [ ] Standalone component (no NgModule)
- [ ] `ChangeDetectionStrategy.OnPush` set
- [ ] `input()` and `output()` functions (not decorators)
- [ ] Proper TypeScript types (no `any`)
- [ ] Accessibility attributes (ARIA, labels)
- [ ] Reactive forms (not template-driven)
- [ ] Native control flow (`@if`, `@for`, `@switch`)
- [ ] No `ngClass` or `ngStyle`
- [ ] Services use `inject()` function
- [ ] Relative paths for templates/styles
- [ ] Pure, predictable state transformations
- [ ] Error handling implemented

## TypeScript & Angular Versions

- **Angular:** v20+ (latest)
- **TypeScript:** Strict mode enabled
- **Node:** LTS or latest

## Questions or Issues?

Refer to project CLAUDE.md for complete guidelines, or consult the reference files for specific patterns.
