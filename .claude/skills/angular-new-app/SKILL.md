---
name: angular-new-app
description: This skill should be used when the user asks to "create a new Angular app", "scaffold a new Angular project", "set up a new Angular application", "initialize an Angular project", or "generate a new Angular workspace". Provides guidance on using the Angular CLI to create modern Angular applications and structure them according to best practices.
version: 1.0.0
---

# Angular New App Skill

Creates a new Angular app using the Angular CLI with modern best practices. This skill provides important guidelines for effectively setting up and structuring a modern Angular application aligned with v20+ standards and project requirements.

## When to Use This Skill

Use when:

- Creating a brand new Angular project/workspace
- Scaffolding a new Angular application
- Setting up a development environment for an Angular app
- Configuring initial project structure
- Initializing feature modules or standalone routes

## Quick Start

### Create New Angular App

```bash
ng new my-app --skip-git
cd my-app
```

### Modern Configuration (Angular v20+)

The Angular CLI creates projects with modern defaults:

- ✅ Standalone components by default
- ✅ Signals-based state management
- ✅ Skip NgModules (use standalone routes)
- ✅ TypeScript strict mode enabled
- ✅ Vitest as default test runner

## Project Structure

### Recommended Directory Layout

```
my-app/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Root component
│   │   ├── app.routes.ts              # Route configuration
│   │   ├── app.config.ts              # App configuration
│   │   │
│   │   ├── features/                  # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── pages/
│   │   │   │   └── services/
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.routes.ts
│   │   │   │   └── components/
│   │   │
│   │   ├── shared/                    # Shared components & services
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   │
│   │   └── core/                      # Core services (singleton)
│   │       ├── services/
│   │       └── interceptors/
│   │
│   ├── assets/                        # Static assets
│   ├── styles/                        # Global styles
│   ├── main.ts                        # App bootstrap
│   └── index.html
│
├── angular.json                       # Angular CLI config
├── tsconfig.json                      # TypeScript config
├── tsconfig.app.json                  # App TypeScript config
├── package.json
└── README.md
```

## Initial Setup Checklist

### 1. Create Project

```bash
ng new my-app \
  --skip-git \
  --skip-install
```

### 2. Review Configuration

- [ ] Check `angular.json` for build/serve configs
- [ ] Verify `tsconfig.json` has `strict: true`
- [ ] Check `package.json` dependencies
- [ ] Review `.browserslistrc` for target browsers

### 3. Add Essential Packages

```bash
npm install
# Already included by default:
# - Angular core libraries
# - TypeScript
# - RxJS
# - Zone.js
```

### 4. Configure App

Update `src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Add other providers here
  ],
};
```

### 5. Set Up Routes

Create `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'features',
    loadChildren: () => import('./features/feature.routes').then((m) => m.FEATURE_ROUTES),
  },
];
```

### 6. Bootstrap App

Update `src/main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
```

### 7. Root Component

Update `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header>
      <!-- Header content -->
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <footer>
      <!-- Footer content -->
    </footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      main {
        flex: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'my-app';
}
```

## Development

### Start Dev Server

```bash
ng serve
# Opens http://localhost:4200
```

### Generate Components/Services

```bash
# Component
ng generate component features/user/user-profile --standalone

# Service
ng generate service core/services/auth

# Directive
ng generate directive shared/directives/click-outside --standalone

# Pipe
ng generate pipe shared/pipes/safe-html --standalone
```

### Build for Production

```bash
ng build

# Output in dist/my-app/browser/
```

## Testing Setup

### Run Tests

```bash
# Vitest (default)
ng test

# With coverage
ng test --coverage
```

### Test Configuration

Tests run with Vitest by default (modern alternative to Karma/Jasmine).

## Best Practices for New Projects

### Architecture

- Use feature-based folder structure
- Keep shared components in `shared/` folder
- Put singleton services in `core/`
- Use lazy loading for feature routes
- Keep feature modules self-contained

### Components

- Always use standalone components
- Keep components focused (single responsibility)
- Use signals for state
- Set `ChangeDetectionStrategy.OnPush`
- Use relative paths for templates/styles

### State Management

- Use signals for component-level state
- Use services with signals for global state
- Avoid nested observables (use signals or async pipe)
- Keep state immutable (use `set()` and `update()`)

### HTTP and Services

- Create services with `providedIn: 'root'`
- Use HttpClient with interceptors
- Use signals to manage async state
- Implement proper error handling

### Forms

- Always use Reactive Forms (never Template-driven)
- Leverage strong typing with FormBuilder
- Implement validation at both field and form level
- Use signals with forms for reactivity

### Accessibility

- Start with semantic HTML
- Include ARIA attributes from the beginning
- Implement keyboard navigation
- Test with accessibility tools (AXE, Lighthouse)
- Follow WCAG AA from day one

### TypeScript

- Enable strict mode (default)
- Avoid `any` type
- Use strong typing throughout
- Leverage type inference when obvious

## Environment Configuration

### Development vs Production

Create `environment.ts` and `environment.prod.ts`:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',
};
```

Update `angular.json` to use environment files during builds.

## Additional Setup

### Add ESLint

```bash
ng add @angular/eslint
```

### Add Tailwind CSS (Optional)

```bash
ng add @tailwindcss/angular
```

### Add Testing Library

```bash
npm install --save-dev @testing-library/angular
```

## Initial Deployment

### Build Optimization

- [ ] Enable ahead-of-time (AOT) compilation (default)
- [ ] Enable source maps for debugging
- [ ] Configure compression
- [ ] Set up caching headers
- [ ] Configure GZIP compression

### Deployment Options

- **Static hosting:** Netlify, Vercel, GitHub Pages
- **Docker:** Create Dockerfile for containerization
- **Traditional server:** Apache, Nginx, etc.
- **Cloud platforms:** AWS, Google Cloud, Azure

## Troubleshooting

### Port Already in Use

```bash
ng serve --port 4201
```

### Clear Cache

```bash
rm -rf .angular/cache
ng cache clean
```

### Module Import Errors

Ensure all components imported in routes are `standalone: true`.

### Build Size Issues

- Check `ng build --stats-json`
- Analyze with `npm install -g webpack-bundle-analyzer`
- Use lazy loading for large features
- Implement code splitting

## Additional Resources

### Reference Files

- **`references/routing-patterns.md`** - Advanced routing configuration
- **`references/forms-patterns.md`** - Reactive forms setup

### Angular Documentation

- [Angular Getting Started](https://angular.io/start)
- [Angular CLI Docs](https://angular.io/cli)
- [Angular Style Guide](https://angular.io/guide/styleguide)

## Next Steps After Creation

1. **Install dependencies:** `npm install`
2. **Start dev server:** `ng serve`
3. **Create first feature:** `ng generate component features/home`
4. **Set up routing:** Configure feature routes
5. **Implement core services:** Auth, HTTP, etc.
6. **Add shared components:** Create reusable UI components
7. **Set up accessibility:** Configure AXE testing
8. **Configure testing:** Set up unit/E2E tests
9. **Deploy:** Build and deploy to your hosting

## Version Info

- **Angular:** v20+ (latest)
- **Node:** 20+ LTS
- **TypeScript:** 5.5+
- **Test Runner:** Vitest (default)
